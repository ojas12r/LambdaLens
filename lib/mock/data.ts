import type { AnomalyRecord } from "@/lib/types";

/* ──────────────────── Mock Anomalies ──────────────────── */

export function getMockAnomalies(): AnomalyRecord[] {
  const now = Date.now();

  return [
    {
      id: "mock-001",
      function_name: "image-processor-prod",
      arn: "arn:aws:lambda:us-east-1:123456789:function:image-processor-prod",
      cost_increase_pct: 340,
      current_cost: 142.5,
      previous_cost: 32.4,
      root_cause:
        "S3 GetObject timeout retries causing infinite reprocessing loop via SQS dead-letter queue",
      status: "resolved",
      created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now - 1.5 * 60 * 60 * 1000).toISOString(),
      agent_explanation: `Investigation Summary:
1. Billing Analysis — image-processor-prod cost increased 340% ($32.40 → $142.50) over the last 6 hours.
2. Log Analysis — 847 CloudWatch events retrieved; 312 ERROR-level entries, all related to S3 GetObject timeouts on bucket "media-uploads-prod".
3. Correlation — Every S3 timeout triggered a Lambda failure, which sent the message to an SQS dead-letter queue. A misconfigured DLQ redrive policy was re-enqueuing the same message, creating an infinite retry loop.
4. Vector Search — 98% similarity to Incident #127 (2024-11-02) which had the same S3 VPC endpoint saturation pattern.

The root cause is a missing circuit breaker combined with an unlimited SQS maxReceiveCount.`,
      suggested_fix:
        "1. Set SQS maxReceiveCount to 5 to cap retries.\n2. Add exponential backoff with jitter to the S3 client (max 3 attempts).\n3. Configure a CloudWatch alarm on ApproximateNumberOfMessagesNotVisible > 100.\n4. Consider adding an S3 VPC Gateway endpoint if not already present.",
      confidence: 0.92,
    },
    {
      id: "mock-002",
      function_name: "payment-webhook-handler",
      arn: "arn:aws:lambda:us-east-1:123456789:function:payment-webhook-handler",
      cost_increase_pct: 180,
      current_cost: 84.0,
      previous_cost: 30.0,
      root_cause: null,
      status: "detected",
      created_at: new Date(now - 45 * 60 * 1000).toISOString(),
      resolved_at: null,
      agent_explanation: null,
      suggested_fix: null,
      confidence: null,
    },
    {
      id: "mock-003",
      function_name: "user-auth-service",
      arn: "arn:aws:lambda:us-east-1:123456789:function:user-auth-service",
      cost_increase_pct: 95,
      current_cost: 23.4,
      previous_cost: 12.0,
      root_cause:
        "Cold-start storm during rolling deployment without provisioned concurrency",
      status: "resolved",
      created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now - 6 * 60 * 60 * 1000).toISOString(),
      agent_explanation: `Deployment at 02:14 UTC triggered a full cold-start cycle across all 48 concurrent instances. Without provisioned concurrency, each invocation paid the ~800ms cold-start tax. The deploy strategy uses "all-at-once" instead of canary/linear, amplifying the spike.

Recommendation: Switch to CodeDeploy Linear10PercentEvery1Minute and enable provisioned concurrency = 20 for this function.`,
      suggested_fix:
        "1. Enable provisioned concurrency (start with 20).\n2. Switch deployment preference to Linear10PercentEvery1Minute.\n3. Add a pre-warming CloudWatch scheduled rule.",
      confidence: 0.87,
    },
    {
      id: "mock-004",
      function_name: "data-pipeline-etl",
      arn: "arn:aws:lambda:us-east-1:123456789:function:data-pipeline-etl",
      cost_increase_pct: 250,
      current_cost: 105.0,
      previous_cost: 30.0,
      root_cause: null,
      status: "investigating",
      created_at: new Date(now - 30 * 60 * 1000).toISOString(),
      resolved_at: null,
      agent_explanation:
        "Preliminary analysis: Invocation count increased 6x. Checking upstream event sources and DynamoDB Streams configuration…",
      suggested_fix: null,
      confidence: null,
    },
    {
      id: "mock-005",
      function_name: "notification-sender",
      arn: "arn:aws:lambda:us-east-1:123456789:function:notification-sender",
      cost_increase_pct: 120,
      current_cost: 16.5,
      previous_cost: 7.5,
      root_cause: "Expected traffic spike — Black Friday marketing campaign",
      status: "dismissed",
      created_at: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now - 11 * 60 * 60 * 1000).toISOString(),
      agent_explanation:
        "Invocation count correlates exactly with the scheduled marketing campaign email blast (200K recipients). No errors detected. Costs are within the projected budget for this event.",
      suggested_fix: "No action needed — expected behavior.",
      confidence: 0.95,
    },
    {
      id: "mock-006",
      function_name: "search-indexer",
      arn: "arn:aws:lambda:us-east-1:123456789:function:search-indexer",
      cost_increase_pct: 75,
      current_cost: 18.2,
      previous_cost: 10.4,
      root_cause:
        "Elasticsearch bulk indexing batch size reduced from 500 to 10 after config change",
      status: "resolved",
      created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
      resolved_at: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      agent_explanation:
        "A configuration deployment at 14:22 UTC changed BATCH_SIZE from 500 to 10, increasing invocation count 50x. Each invocation had minimal payload but full cold-start overhead.",
      suggested_fix:
        "Revert BATCH_SIZE to 500. Add config validation to CI/CD pipeline.",
      confidence: 0.94,
    },
  ];
}

/* ──────────────────── Mock Cost Snapshots ──────────────────── */

interface MockCostSnapshot {
  id: string;
  function_name: string;
  cost: string;
  period_start: string;
  period_end: string;
}

const FUNCTION_PROFILES = [
  { name: "image-processor-prod", baseCost: 5.0, spikeHours: new Set([1, 2, 3, 4, 5]), spikeMultiplier: 3.4 },
  { name: "payment-webhook-handler", baseCost: 3.0, spikeHours: new Set([0, 1, 2]), spikeMultiplier: 1.8 },
  { name: "user-auth-service", baseCost: 2.0, spikeHours: new Set<number>(), spikeMultiplier: 1 },
  { name: "data-pipeline-etl", baseCost: 4.0, spikeHours: new Set([0, 1]), spikeMultiplier: 2.5 },
  { name: "notification-sender", baseCost: 1.5, spikeHours: new Set<number>(), spikeMultiplier: 1 },
  { name: "api-gateway-proxy", baseCost: 1.0, spikeHours: new Set<number>(), spikeMultiplier: 1 },
  { name: "search-indexer", baseCost: 2.5, spikeHours: new Set([5, 6, 7]), spikeMultiplier: 1.75 },
];

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getMockCostSnapshots(): MockCostSnapshot[] {
  const snapshots: MockCostSnapshot[] = [];
  const now = Date.now();

  for (let hoursAgo = 23; hoursAgo >= 0; hoursAgo--) {
    for (let fi = 0; fi < FUNCTION_PROFILES.length; fi++) {
      const fn = FUNCTION_PROFILES[fi];
      const periodStart = new Date(now - hoursAgo * 3_600_000);
      const periodEnd = new Date(now - (hoursAgo - 1) * 3_600_000);

      const noise = (pseudoRandom(hoursAgo * 100 + fi) - 0.5) * fn.baseCost * 0.25;
      let cost = fn.baseCost + noise;
      if (fn.spikeHours.has(hoursAgo)) cost *= fn.spikeMultiplier;

      snapshots.push({
        id: `snap-${fn.name}-${hoursAgo}`,
        function_name: fn.name,
        cost: Math.max(cost, 0.01).toFixed(4),
        period_start: periodStart.toISOString(),
        period_end: periodEnd.toISOString(),
      });
    }
  }
  return snapshots;
}

/* ──────────────────── Mock Hourly Totals (for area chart) ──────────────────── */

export interface HourlyCostPoint {
  hour: string;
  cost: number;
}

export function getMockHourlyCosts(): HourlyCostPoint[] {
  const now = Date.now();
  const points: HourlyCostPoint[] = [];

  for (let h = 23; h >= 0; h--) {
    const time = new Date(now - h * 3_600_000);
    const label = time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

    let total = 0;
    for (let fi = 0; fi < FUNCTION_PROFILES.length; fi++) {
      const fn = FUNCTION_PROFILES[fi];
      const noise = (pseudoRandom(h * 100 + fi) - 0.5) * fn.baseCost * 0.25;
      let cost = fn.baseCost + noise;
      if (fn.spikeHours.has(h)) cost *= fn.spikeMultiplier;
      total += Math.max(cost, 0.01);
    }
    points.push({ hour: label, cost: parseFloat(total.toFixed(2)) });
  }
  return points;
}

/* ──────────────────── Mock Trace Spans ──────────────────── */

export interface MockTraceSpan {
  name: string;
  startMs: number;
  durationMs: number;
  status: "ok" | "error" | "timeout";
}

export function getMockTraceSpans(): MockTraceSpan[] {
  return [
    { name: "API Gateway", startMs: 0, durationMs: 15, status: "ok" },
    { name: "Lambda Cold Start", startMs: 15, durationMs: 800, status: "ok" },
    { name: "S3 GetObject", startMs: 815, durationMs: 12_000, status: "timeout" },
    { name: "S3 Retry #1", startMs: 12_815, durationMs: 12_000, status: "timeout" },
    { name: "S3 Retry #2", startMs: 24_815, durationMs: 350, status: "ok" },
    { name: "Image Processing", startMs: 25_165, durationMs: 2_400, status: "ok" },
    { name: "DynamoDB PutItem", startMs: 27_565, durationMs: 45, status: "ok" },
  ];
}

export const MOCK_TRACE_TOTAL_DURATION_MS = 27_610;

/* ──────────────────── Mock Activity Feed ──────────────────── */

export interface ActivityEvent {
  id: string;
  type: "anomaly_detected" | "investigation_started" | "root_cause_found" | "resolved" | "dismissed" | "deployment";
  title: string;
  description: string;
  timestamp: string;
  functionName?: string;
}

export function getMockActivityFeed(): ActivityEvent[] {
  const now = Date.now();
  return [
    {
      id: "evt-1",
      type: "anomaly_detected",
      title: "Cost spike detected",
      description: "payment-webhook-handler — 180% increase ($30 → $84)",
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      functionName: "payment-webhook-handler",
    },
    {
      id: "evt-2",
      type: "investigation_started",
      title: "Investigation started",
      description: "AI agent is analyzing CloudWatch logs and DynamoDB traces.",
      timestamp: new Date(now - 44 * 60 * 1000).toISOString(),
      functionName: "payment-webhook-handler",
    },
    {
      id: "evt-3",
      type: "resolved",
      title: "Anomaly resolved",
      description: "search-indexer — batch size reverted to 500",
      timestamp: new Date(now - 4 * 60 * 60 * 1000).toISOString(),
      functionName: "search-indexer",
    }
  ];
}