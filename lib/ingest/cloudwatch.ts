// lib/ingest/cloudwatch.ts

import {
  CloudWatchLogsClient,
  FilterLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { cookies } from "next/headers";
import type { LogEntry } from "../types";

// ── Build CloudWatch Logs client (supports LocalStack endpoint override & Cookies) ──
function buildCloudWatchClient(): CloudWatchLogsClient {
  const config: ConstructorParameters<typeof CloudWatchLogsClient>[0] = {
    region: process.env.AWS_REGION ?? "us-east-1",
  };

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
  } catch (err) {
    // Ignore: outside of request context
  }

  if (process.env.USE_LOCALSTACK === "true" && process.env.LOCALSTACK_ENDPOINT) {
    config.endpoint = process.env.LOCALSTACK_ENDPOINT;
    console.info("[LocalStack] Using CloudWatch endpoint:", process.env.LOCALSTACK_ENDPOINT);
  }

  config.credentials = { accessKeyId, secretAccessKey };

  return new CloudWatchLogsClient(config);
}

// --- MOCK HELPER (fallback when no LocalStack or real AWS) ---
function generateMockCloudWatchLogs(
  functionName: string,
  count: number = 10
): LogEntry[] {
  const logs: LogEntry[] = [];
  const now = Date.now();

  const mockMessages = [
    `INFO: ${functionName} started processing request.`,
    `INFO: Successfully connected to DynamoDB.`,
    `WARN: High latency for external API call to user-service.`,
    `ERROR: S3 timeout: Failed to get object 'input-image.jpg' from bucket 'my-bucket' after 3 retries.`,
    `ERROR: Unhandled exception in ${functionName}: Invalid JSON payload.`,
    `INFO: ${functionName} completed successfully. Duration: 150ms.`,
    `ERROR: Task timed out after 30000 ms`,
    `INFO: Processing item ID: abc-123.`,
    `ERROR: Database connection failed.`,
  ];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - Math.random() * 60 * 60 * 1000).toISOString(); // Last hour
    const message = mockMessages[Math.floor(Math.random() * mockMessages.length)];
    const level: LogEntry['level'] = message.includes('ERROR') ? 'ERROR' : (message.includes('WARN') ? 'WARN' : 'INFO');
    const requestId = `req-${Math.random().toString(36).substring(2, 10)}`;
    const duration = level === 'ERROR' && message.includes('timeout') ? undefined : Math.floor(Math.random() * 500) + 50;

    logs.push({ timestamp, message, level, requestId, duration });
  }
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function fetchCloudWatchLogs(
  functionName: string,
  lookbackMinutes = 60
): Promise<LogEntry[]> {
  const client = buildCloudWatchClient();
  // If MOCK_AWS_SERVICES is true and NOT using LocalStack, return mock logs
  if (process.env.MOCK_AWS_SERVICES === "true" && process.env.USE_LOCALSTACK !== "true") {
    console.warn(`[MOCK] Using mock CloudWatch logs for ${functionName}.`);
    return generateMockCloudWatchLogs(functionName, 20);
  }

  const logGroupName = `${process.env.CLOUDWATCH_LOG_GROUP}/${functionName}`;
  const startTime = Date.now() - lookbackMinutes * 60 * 1000;

  try {
    const command = new FilterLogEventsCommand({
      logGroupName,
      startTime,
      // Focus on errors and timeouts
      filterPattern: '?\"ERROR\" ?\"TIMEOUT\" ?\"Task timed out\" ?\"REPORT\"',
      limit: 50,
    });

    const response = await client.send(command);

    const entries = (response.events ?? []).map((event) => ({
      timestamp: new Date(event.timestamp ?? 0).toISOString(),
      message: event.message?.trim() ?? "",
      level: classifyLogLevel(event.message ?? ""),
      requestId: extractRequestId(event.message ?? ""),
      duration: extractDuration(event.message ?? ""),
    }));

    if (process.env.USE_LOCALSTACK === "true") {
      console.info(`[LocalStack] Fetched ${entries.length} log events for ${functionName}`);
    }

    return entries;
  } catch (error) {
    console.error(`CloudWatch query failed for ${functionName}:`, error);
    return [
      {
        timestamp: new Date().toISOString(),
        message: `[CloudWatch unavailable] Could not fetch logs for ${functionName}. Check IAM permissions or set MOCK_AWS_SERVICES=true.`,
        level: "WARN",
      },
    ];
  }
}

function classifyLogLevel(message: string): LogEntry["level"] {
  if (message.includes("ERROR") || message.includes("Task timed out")) return "ERROR";
  if (message.includes("WARN")) return "WARN";
  return "INFO";
}

function extractRequestId(message: string): string | undefined {
  // Lambda request IDs follow the pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const match = message.match(
    /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i
  );
  return match?.[1];
}

function extractDuration(message: string): number | undefined {
  // REPORT lines contain "Duration: 123.45 ms"
  const match = message.match(/Duration:\s*([\d.]+)\s*ms/);
  return match ? parseFloat(match[1]) : undefined;
}