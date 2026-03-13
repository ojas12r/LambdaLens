import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { queryAthenaForSpike } from "../ingest/athena";
import { fetchCloudWatchLogs } from "../ingest/cloudwatch";
import { searchSimilarAnomalies } from "../vector/upstash";

export const billingTool = tool(
  async ({ timeRange }) => {
    const spike = await queryAthenaForSpike(timeRange);
    if (!spike) return "No significant cost spikes detected in the requested time range.";

    return JSON.stringify({
      functionName: spike.functionName,
      costIncreasePct: spike.percentage,
      currentCost: `$${spike.currentCost.toFixed(2)}`,
      previousCost: `$${spike.previousCost.toFixed(2)}`,
      arn: spike.arn,
      detectedAt: spike.timestamp,
    });
  },
  {
    name: "check_billing_spike",
    description:
      "Queries AWS Athena to find which Lambda function caused a cost spike. Returns the top offender with cost comparison.",
    schema: z.object({
      timeRange: z
        .enum(["last_1_hour", "last_6_hours", "last_24_hours"])
        .describe("Time range to analyze"),
    }),
  }
);

export const logTool = tool(
  async ({ functionName, lookbackMinutes }) => {
    const logs = await fetchCloudWatchLogs(functionName, lookbackMinutes);

    if (logs.length === 0) return `No logs found for ${functionName} in the last ${lookbackMinutes} minutes.`;

    const errorCount = logs.filter((l) => l.level === "ERROR").length;
    const timeoutCount = logs.filter((l) =>
      l.message.includes("Task timed out")
    ).length;
    const avgDuration =
      logs
        .filter((l) => l.duration != null)
        .reduce((sum, l) => sum + (l.duration ?? 0), 0) /
      (logs.filter((l) => l.duration != null).length || 1);

    const summary = [
      `=== Log Analysis for ${functionName} ===`,
      `Total events: ${logs.length}`,
      `Errors: ${errorCount}`,
      `Timeouts: ${timeoutCount}`,
      `Avg Duration: ${avgDuration.toFixed(0)}ms`,
      ``,
      `=== Recent Error Logs ===`,
      ...logs
        .filter((l) => l.level === "ERROR")
        .slice(0, 10)
        .map((l) => `[${l.timestamp}] ${l.message}`),
    ];

    return summary.join("\n");
  },
  {
    name: "fetch_logs",
    description:
      "Fetches and summarizes recent error, timeout, and performance logs for a specific Lambda function from CloudWatch.",
    schema: z.object({
      functionName: z.string().describe("The Lambda function name"),
      lookbackMinutes: z
        .number()
        .default(60)
        .describe("How many minutes of logs to retrieve"),
    }),
  }
);

export const similarAnomalyTool = tool(
  async ({ description }) => {
    const results = await searchSimilarAnomalies(description, 3);

    if (results.length === 0) return "No similar past anomalies found.";

    return results
      .map(
        (r, i) =>
          `Past Anomaly ${i + 1} (similarity: ${(r.score * 100).toFixed(0)}%): ` +
          `Function: ${r.metadata.function_name}, ` +
          `Root cause: ${r.metadata.root_cause ?? "unknown"}, ` +
          `Resolution: ${r.metadata.resolution ?? "none recorded"}`
      )
      .join("\n");
  },
  {
    name: "search_past_anomalies",
    description:
      "Searches the vector database for similar past cost anomalies to help identify recurring patterns.",
    schema: z.object({
      description: z
        .string()
        .describe("Natural language description of the current anomaly"),
    }),
  }
);

export const tools = [billingTool, logTool, similarAnomalyTool];
