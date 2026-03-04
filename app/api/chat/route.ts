import { detective } from "@/lib/agent/graph";
import { HumanMessage } from "@langchain/core/messages";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    if (!input || typeof input !== "string") {
      return Response.json({ error: "Missing 'input' field" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
    }

    // Invoke the LangGraph RAG Agent directly
    const result = await detective.invoke({
      messages: [new HumanMessage(input)],
    });

    const finalMessage = result.messages[result.messages.length - 1];
    const response =
        typeof finalMessage.content === "string"
          ? finalMessage.content
          : JSON.stringify(finalMessage.content);

    return Response.json({ response });
  } catch (err) {
    console.error("Chat route error:", err);
    // Explicitly handle authentication errors since LangChain might throw differently
    const message = err instanceof Error ? err.message : "Internal server error";
    return Response.json({ error: message }, { status: 500 });
  }
}