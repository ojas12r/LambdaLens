import { upsertAnomaly } from "@/lib/vector/upstash";
import { updateAnomalyWithFindings } from "@/lib/db/supabase";
import { detective } from "@/lib/agent/graph";
import { HumanMessage } from "@langchain/core/messages";
import type { CostSpike } from "@/lib/types";

export const maxDuration = 300; // 5 mins

export async function POST(req: Request) {
  try {
    const { anomalyId, spike } = (await req.json()) as { anomalyId: string; spike: CostSpike };

    if (!anomalyId || !spike) {
      return Response.json({ error: "Missing payload" }, { status: 400 });
    }

    const description = `Cost spike of ${spike.percentage}% in Lambda function ${spike.functionName}. Cost went from $${spike.previousCost} to $${spike.currentCost}.`;
    
    // 1. Store in vector DB for future similarity searches
    await upsertAnomaly(`anomaly-${anomalyId}`, description, {
      function_name: spike.functionName,
      cost_increase_pct: spike.percentage,
      anomaly_id: anomalyId,
    });

    // 2. Run the detective agent
    const agentInput = `Investigate this cost anomaly: ${spike.functionName} has seen a ${spike.percentage}% cost increase. Current cost: $${spike.currentCost}, previous period: $${spike.previousCost}. ARN: ${spike.arn}`;
    const result = await detective.invoke({
      messages: [new HumanMessage(agentInput)],
      spikeData: {
        functionName: spike.functionName,
        costIncrease: spike.percentage,
        anomalyId,
      },
    });

    const finalMessage = result.messages[result.messages.length - 1];
    const explanation = typeof finalMessage.content === "string" 
      ? finalMessage.content 
      : JSON.stringify(finalMessage.content);

    // 3. Extract the final agent message and persist findings
    await updateAnomalyWithFindings(
      anomalyId,
      result.suspectedRootCause || "See explanation",
      explanation,
      "See explanation for detailed steps",
      0.85
    );

    // 4. Update vector DB with post-investigation metadata
    await upsertAnomaly(`anomaly-${anomalyId}`, description, {
      function_name: spike.functionName,
      cost_increase_pct: spike.percentage,
      anomaly_id: anomalyId,
      root_cause: result.suspectedRootCause || "See explanation",
      resolution: "See explanation for detailed steps",
    });

    return Response.json({ status: "success", anomalyId });
  } catch (err) {
    console.error("Worker failed:", err);
    return Response.json({ error: "Worker failed" }, { status: 500 });
  }
}
