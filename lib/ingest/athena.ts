import {
  AthenaClient,
  StartQueryExecutionCommand,
  GetQueryExecutionCommand,
  GetQueryResultsCommand,
  QueryExecutionState,
} from "@aws-sdk/client-athena";
import {
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { cookies } from "next/headers";
import type { CostSpike } from "../types";

function getAwsConfig() {
  const config: any = { region: process.env.AWS_REGION ?? "us-east-1" };
  let accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? "test";
  let secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? "test";

  try {
    const cookieStore = cookies();
    const cookieKey = cookieStore.get("aegis_aws_key_id")?.value;
    const cookieSec = cookieStore.get("aegis_aws_secret")?.value;
    const cookieRegion = cookieStore.get("aegis_aws_region")?.value;
    if (cookieKey) accessKeyId = cookieKey;
    if (cookieSec) secretAccessKey = cookieSec;
    if (cookieRegion) config.region = cookieRegion;
  } catch {
    // Ignore: outside request context
  }

  if (process.env.USE_LOCALSTACK === "true" && process.env.LOCALSTACK_ENDPOINT) {
    config.endpoint = process.env.LOCALSTACK_ENDPOINT;
  }

  config.credentials = { accessKeyId, secretAccessKey };
  return config;
}

// ── Build Athena client (supports LocalStack endpoint override) ──
function buildAthenaClient(): AthenaClient {
  const config = getAwsConfig();
  if (process.env.USE_LOCALSTACK === "true") {
    console.info("[LocalStack] Using Athena endpoint:", process.env.LOCALSTACK_ENDPOINT);
  }
  return new AthenaClient(config);
}

function buildS3Client(): S3Client {
  const config = getAwsConfig();
  if (process.env.USE_LOCALSTACK === "true") {
    config.forcePathStyle = true;
  }
  return new S3Client(config);
}

const QUERY_TIMEOUT_MS = 30_000;
const POLL_INTERVAL_MS = 2_000;

// ════════════════════════════════════════════════════════════
//  Option A: S3-based local cost data query (no Athena Pro needed)
//  Reads the CUR CSV from S3, parses it, and computes spikes in-process.
// ════════════════════════════════════════════════════════════

interface CurRow {
  resourceId: string;
  cost: number;
  timestamp: Date;
  productCode: string;
}

function parseCurCsv(csv: string): CurRow[] {
  const lines = csv.trim().split("\n");
  // Skip header row
  return lines.slice(1).map((line) => {
    const [resourceId, cost, timestamp, productCode] = line.split(",");
    return {
      resourceId: resourceId.trim(),
      cost: parseFloat(cost.trim()),
      timestamp: new Date(timestamp.trim()),
      productCode: productCode.trim(),
    };
  });
}

async function queryLocalCostData(hoursNum: number): Promise<CostSpike | null> {
  const s3 = buildS3Client();
  const bucket = "finops-athena-results";
  const key = "cur-data/cost_and_usage_report.csv";

  console.info("[LocalStack] Querying cost data from S3 (Athena fallback)");

  const response = await s3.send(
    new GetObjectCommand({ Bucket: bucket, Key: key })
  );

  const csvText = await response.Body?.transformToString("utf-8");
  if (!csvText) {
    console.warn("[LocalStack] No CSV data found in S3");
    return null;
  }

  const rows = parseCurCsv(csvText);
  const lambdaRows = rows.filter((r) => r.productCode === "AWSLambda");

  // Use the most recent timestamp in the data as "now" reference
  // (the CSV has fixed dates, so using Date.now() would never match)
  const maxTimestamp = Math.max(...lambdaRows.map((r) => r.timestamp.getTime()));
  const currentPeriodStart = maxTimestamp - hoursNum * 60 * 60 * 1000;
  const previousPeriodStart = currentPeriodStart - hoursNum * 60 * 60 * 1000;

  // Group by resource: current period vs previous period
  const currentCosts = new Map<string, number>();
  const previousCosts = new Map<string, number>();

  for (const row of lambdaRows) {
    const ts = row.timestamp.getTime();
    if (ts >= currentPeriodStart && ts <= maxTimestamp) {
      currentCosts.set(row.resourceId, (currentCosts.get(row.resourceId) ?? 0) + row.cost);
    } else if (ts >= previousPeriodStart && ts < currentPeriodStart) {
      previousCosts.set(row.resourceId, (previousCosts.get(row.resourceId) ?? 0) + row.cost);
    }
  }

  // Find the biggest spike
  let bestSpike: CostSpike | null = null;
  let bestPct = 0;

  for (const [resourceId, currentCost] of currentCosts.entries()) {
    if (currentCost <= 1.0) continue;

    const prevCost = previousCosts.get(resourceId) ?? 0;
    const pctIncrease = prevCost > 0
      ? ((currentCost - prevCost) / prevCost) * 100
      : 100;

    if (pctIncrease >= 50 && pctIncrease > bestPct) {
      bestPct = pctIncrease;
      const functionName = resourceId.includes("function:")
        ? resourceId.split("function:")[1]
        : resourceId;

      bestSpike = {
        functionName,
        percentage: Math.round(pctIncrease),
        arn: resourceId,
        currentCost: Math.round(currentCost * 100) / 100,
        previousCost: Math.round(prevCost * 100) / 100,
        timestamp: new Date().toISOString(),
      };
    }
  }

  if (bestSpike) {
    console.info(
      `[LocalStack] Detected spike: ${bestSpike.functionName} → ${bestSpike.percentage}% increase ($${bestSpike.previousCost} → $${bestSpike.currentCost})`
    );
  } else {
    console.info("[LocalStack] No cost spikes detected in S3 data");
  }

  return bestSpike;
}

export async function getAthenaHourlyCosts(hours = 24): Promise<{ time: string; "Cost($)": number }[]> {
  const s3 = buildS3Client();
  const bucket = "finops-athena-results";
  const key = "cur-data/cost_and_usage_report.csv";

  try {
    const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const csvText = await response.Body?.transformToString("utf-8");
    if (!csvText) return [];

    const rows = parseCurCsv(csvText);
    if (!rows.length) return [];
    
    const maxTimestamp = Math.max(...rows.map((r) => r.timestamp.getTime()));
    const startTime = maxTimestamp - hours * 60 * 60 * 1000;

    const hourlyMap = new Map<string, number>();
    for (const row of rows) {
      if (row.timestamp.getTime() >= startTime) {
        // Group by hour
        const hourStr = new Date(row.timestamp.setMinutes(0,0,0)).toISOString().substring(11, 16);
        hourlyMap.set(hourStr, (hourlyMap.get(hourStr) ?? 0) + row.cost);
      }
    }

    const result = Array.from(hourlyMap.entries())
      .map(([time, cost]) => ({ time, "Cost($)": Math.round(cost * 100) / 100 }))
      .sort((a, b) => a.time.localeCompare(b.time));

    return result.length ? result : [];
  } catch {
    return [];
  }
}

// ════════════════════════════════════════════════════════════
//  Main exported query function
// ════════════════════════════════════════════════════════════

export async function queryAthenaForSpike(
  timeRange: string
): Promise<CostSpike | null> {
  const intervalMap: Record<string, string> = {
    last_1_hour: "1",
    last_6_hours: "6",
    last_24_hours: "24",
    last_1_day: "24",
  };

  const hoursText = intervalMap[timeRange] ?? "24";
  const hoursNum = parseInt(hoursText, 10);
  if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 168) {
    throw new Error(`Invalid time range: ${timeRange}`);
  }

  // ── LocalStack path: try Athena first, fall back to S3 CSV ──
  if (process.env.USE_LOCALSTACK === "true") {
    try {
      const athenaResult = await queryAthenaViaSDK(hoursNum);
      if (athenaResult) return athenaResult;
    } catch (athenaError) {
      console.warn(
        "[LocalStack] Athena query failed (Pro may not be available), falling back to S3 CSV:",
        athenaError instanceof Error ? athenaError.message : athenaError
      );
    }

    // Fallback: read cost data directly from S3 (no Pro needed)
    try {
      return await queryLocalCostData(hoursNum);
    } catch (s3Error) {
      console.error("[LocalStack] S3 cost data fallback also failed:", s3Error);
      return null;
    }
  }

  // ── Production path: real Athena ──
  try {
    return await queryAthenaViaSDK(hoursNum);
  } catch (error) {
    console.error("Athena query failed:", error);
    // Return mock data in development so the agent can still function
    if (process.env.MOCK_AWS_SERVICES === "true") {
      return {
        functionName: "process-image-v2",
        percentage: 300,
        arn: "arn:aws:lambda:us-east-1:123456789:function:process-image-v2",
        currentCost: 120.0,
        previousCost: 30.0,
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }
}

// ════════════════════════════════════════════════════════════
//  Real Athena SDK query (works with AWS or LocalStack Pro)
// ════════════════════════════════════════════════════════════

async function queryAthenaViaSDK(hoursNum: number): Promise<CostSpike | null> {
  const query = `
    WITH current_period AS (
      SELECT
        line_item_resource_id AS resource_id,
        SUM(line_item_unblended_cost) AS current_cost
      FROM ${process.env.ATHENA_DATABASE}.cost_and_usage_report
      WHERE line_item_usage_start_date >= date_add('hour', -${hoursNum}, now())
        AND line_item_product_code = 'AWSLambda'
      GROUP BY line_item_resource_id
    ),
    previous_period AS (
      SELECT
        line_item_resource_id AS resource_id,
        SUM(line_item_unblended_cost) AS previous_cost
      FROM ${process.env.ATHENA_DATABASE}.cost_and_usage_report
      WHERE line_item_usage_start_date >= date_add('hour', -${hoursNum * 2}, now())
        AND line_item_usage_start_date < date_add('hour', -${hoursNum}, now())
        AND line_item_product_code = 'AWSLambda'
      GROUP BY line_item_resource_id
    )
    SELECT
      c.resource_id,
      c.current_cost,
      COALESCE(p.previous_cost, 0) AS previous_cost,
      CASE
        WHEN COALESCE(p.previous_cost, 0) > 0
        THEN ((c.current_cost - p.previous_cost) / p.previous_cost) * 100
        ELSE 100
      END AS pct_increase
    FROM current_period c
    LEFT JOIN previous_period p ON c.resource_id = p.resource_id
    WHERE c.current_cost > 1.00
    ORDER BY pct_increase DESC
    LIMIT 1;
  `;

  // Start query
  const athena = buildAthenaClient();
  const startCmd = new StartQueryExecutionCommand({
    QueryString: query,
    ResultConfiguration: {
      OutputLocation: process.env.ATHENA_OUTPUT_BUCKET,
    },
  });
  const { QueryExecutionId } = await athena.send(startCmd);
  if (!QueryExecutionId) throw new Error("No QueryExecutionId returned");

  // Poll for completion
  return await pollForResults(athena, QueryExecutionId);
}

async function pollForResults(athena: AthenaClient, queryId: string): Promise<CostSpike | null> {
  const deadline = Date.now() + QUERY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const statusCmd = new GetQueryExecutionCommand({ QueryExecutionId: queryId });
    const statusResp = await athena.send(statusCmd);
    const state = statusResp.QueryExecution?.Status?.State;

    if (state === QueryExecutionState.SUCCEEDED) {
      return await extractResult(athena, queryId);
    }

    if (
      state === QueryExecutionState.FAILED ||
      state === QueryExecutionState.CANCELLED
    ) {
      const reason = statusResp.QueryExecution?.Status?.StateChangeReason;
      throw new Error(`Athena query ${state}: ${reason}`);
    }

    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }

  throw new Error("Athena query timed out");
}

async function extractResult(athena: AthenaClient, queryId: string): Promise<CostSpike | null> {
  const resultsCmd = new GetQueryResultsCommand({ QueryExecutionId: queryId });
  const resultsResp = await athena.send(resultsCmd);

  const rows = resultsResp.ResultSet?.Rows;
  if (!rows || rows.length < 2) return null; // Only header row

  const dataRow = rows[1].Data;
  if (!dataRow) return null;

  const resourceId = dataRow[0]?.VarCharValue ?? "unknown";
  const currentCost = parseFloat(dataRow[1]?.VarCharValue ?? "0");
  const previousCost = parseFloat(dataRow[2]?.VarCharValue ?? "0");
  const pctIncrease = parseFloat(dataRow[3]?.VarCharValue ?? "0");

  // Only report if increase is >= 50%
  if (pctIncrease < 50) return null;

  // Extract function name from ARN or resource ID
  const functionName = resourceId.includes("function:")
    ? resourceId.split("function:")[1]
    : resourceId;

  return {
    functionName,
    percentage: Math.round(pctIncrease),
    arn: resourceId,
    currentCost,
    previousCost,
    timestamp: new Date().toISOString(),
  };
}