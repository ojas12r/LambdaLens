import { ChatGroq } from "@langchain/groq";
import { StateGraph, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { AgentState } from "./state";
import { tools } from "./tools";
import { DETECTIVE_SYSTEM_PROMPT } from "./prompts";

const model = new ChatGroq({
  model: "llama-3.3-70b-versatile",
  temperature: 0,
  apiKey: process.env.GROQ_API_KEY,
}).bindTools(tools);

async function agentNode(
  state: typeof AgentState.State
): Promise<Partial<typeof AgentState.State>> {
  const systemMessage = new SystemMessage(DETECTIVE_SYSTEM_PROMPT);
  const response = await model.invoke([systemMessage, ...state.messages]);

  // Extract root cause from the final response if available
  let suspectedRootCause = state.suspectedRootCause;
  if (
    typeof response.content === "string" &&
    response.content.includes("Root Cause")
  ) {
    const match = response.content.match(/\*\*Root Cause\*\*:\s*(.+)/);
    if (match) suspectedRootCause = match[1].trim();
  }

  return {
    messages: [response],
    suspectedRootCause,
  };
}

function shouldContinue(state: typeof AgentState.State): "tools" | typeof END {
  const lastMessage = state.messages[state.messages.length - 1];

  if (
    lastMessage instanceof AIMessage &&
    lastMessage.tool_calls &&
    lastMessage.tool_calls.length > 0
  ) {
    return "tools";
  }

  return END;
}

const toolNode = new ToolNode(tools);

const workflow = new StateGraph(AgentState)
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addConditionalEdges("agent", shouldContinue)
  .addEdge("tools", "agent");

export const detective = workflow.compile();