import { queryAthenaForSpike } from "@/lib/ingest/athena";
import { upsertAnomaly } from "@/lib/vector/upstash";
import { insertAnomaly, updateAnomalyWithFindings } from "@/lib/db/supabase";
import { detective } from "@/lib/agent/graph";
import { HumanMessage } from "@langchain/core/messages";
import { validateWebhookSignature } from "@/lib/auth/validate";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
});

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  // Read body once — used for both HMAC validation and payload parsing
  const rawBody = await req.text();

  // Validate webhook signature (skip for cron which has no body signature)
  const isCron = new URL(req.url).searchParams.get("type") === "billing_check";

  if (!isCron) {
    const signature = req.headers.get("x-webhook-signature");
    const secret = process.env.INGEST_WEBHOOK_SECRET ?? "";

    if (!validateWebhookSignature(rawBody, signature, secret)) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }

    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success } = await ratelimit.limit(`ingest_${ip}`);
    if (!success) {
      return Response.json({ error: "Rate limit exceeded" }, { status: 429 });
    }
  }

  const payload = isCron ? { type: "billing_check" } : JSON.parse(rawBody);

  try {
    if (payload.type === "billing_check") {
      const spike = await queryAthenaForSpike("last_1_hour");

      if (!spike) {
        return Response.json({ status: "ok", message: "No spikes detected" });
      }

      // 1. Persist to database (sets status to 'investigating')
      const anomalyId = await insertAnomaly(spike);

      // 2. Trigger asynchronous worker
      const workerUrl = new URL("/api/worker", req.url).toString();
      
      // We purposefully DO NOT await this so the ingestion responds immediately
      fetch(workerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": req.headers.get("cookie") || "" // explicitly forward cookies to worker
        },
        body: JSON.stringify({ anomalyId, spike }),
      }).catch(err => console.error("Worker trigger failed:", err));

      return Response.json({
        status: "accepted",
        anomalyId,
        function: spike.functionName,
        costIncrease: spike.percentage,
      }, { status: 202 });
    }

    return Response.json({ status: "ok", message: "Unknown event type" });
  } catch (error) {
    console.error("Ingest pipeline error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Pipeline failed" },
      { status: 500 }
    );
  }
}

// Support GET for Vercel Cron (crons hit GET by default)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  url.searchParams.set("type", "billing_check");

  // Create a new POST-like request internally
  const syntheticReq = new Request(url.toString(), {
    method: "POST",
    body: JSON.stringify({ type: "billing_check" }),
    headers: { "Content-Type": "application/json" },
  });

  return POST(syntheticReq);
}