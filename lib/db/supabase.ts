import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AnomalyRecord, CostSpike } from "../types";
import { getAthenaHourlyCosts } from "../ingest/athena";

let _client: SupabaseClient | null = null;

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error("Missing Supabase environment variables");
    }
    _client = createClient(url, key, {
      auth: { persistSession: false },
      global: {
        fetch: (fetchUrl, options) => {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5-second timeout
          return fetch(fetchUrl, { ...options, signal: controller.signal }).finally(() =>
            clearTimeout(timeoutId)
          );
        },
      },
    });
  }
  return _client;
}

export async function insertAnomaly(spike: CostSpike): Promise<string> {
  const { data, error } = await getSupabase()
    .from("anomalies")
    .insert({
      function_name: spike.functionName,
      arn: spike.arn,
      cost_increase_pct: spike.percentage,
      current_cost: spike.currentCost,
      previous_cost: spike.previousCost,
      status: "detected",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return data.id;
}

export async function updateAnomalyWithFindings(
  anomalyId: string,
  rootCause: string,
  explanation: string,
  suggestedFix: string,
  confidence: number
) {
  const { error } = await getSupabase()
    .from("anomalies")
    .update({
      status: "resolved",
      root_cause: rootCause,
      agent_explanation: explanation,
      suggested_fix: suggestedFix,
      confidence,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", anomalyId);

  if (error) throw new Error(`Supabase update failed: ${error.message}`);
}

export async function getRecentAnomalies(limit = 20): Promise<AnomalyRecord[]> {
  const { data, error } = await getSupabase()
    .from("anomalies")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(`Supabase fetch failed: ${error.message}`);
  return data ?? [];
}

export async function insertCostSnapshot(
  functionName: string,
  cost: number,
  periodStart: string,
  periodEnd: string
) {
  const { error } = await getSupabase().from("cost_snapshots").insert({
    function_name: functionName,
    cost,
    period_start: periodStart,
    period_end: periodEnd,
  });

  if (error) throw new Error(`Cost snapshot insert failed: ${error.message}`);
}

export async function getCostSnapshots(hours = 24): Promise<any[]> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await getSupabase()
    .from("cost_snapshots")
    .select("*")
    .gte("period_start", since)
    .order("period_start", { ascending: true });

  if (error) throw new Error(`Cost snapshot fetch failed: ${error.message}`);
  return data ?? [];
}

export async function getHourlyCosts(): Promise<any[]> {
  if (process.env.USE_LOCALSTACK === "true") {
    return await getAthenaHourlyCosts(24);
  }
  return [];
}

export async function getTraceSpans(): Promise<any[]> {
  // For LocalStack without X-Ray, return an empty real trace list.
  return [];
}

export async function getActivityFeed(): Promise<any[]> {
  try {
    const anomalies = await getRecentAnomalies(10);
    return anomalies.map((a) => ({
      id: `evt-${a.id}`,
      type: a.status === "resolved" ? "resolved" : "anomaly_detected",
      title: a.status === "resolved" ? "Anomaly resolved" : "Cost spike detected",
      description: `${a.function_name} — ${a.cost_increase_pct}% increase`,
      timestamp: a.resolved_at || a.created_at,
      functionName: a.function_name,
    }));
  } catch {
    return [];
  }
}