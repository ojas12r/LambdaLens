import { Annotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

export const AgentState = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  // Data extracted during investigation
  spikeData: Annotation<{
    functionName: string;
    costIncrease: number;
    anomalyId?: string;
  } | null>({
    // FIX: Must provide reducer and default
    reducer: (_prev, next) => next,
    default: () => null,
  }),
  relevantLogs: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
  suspectedRootCause: Annotation<string>({
    reducer: (_prev, next) => next,
    default: () => "",
  }),
  // Track similar past anomalies for context
  pastAnomalies: Annotation<string[]>({
    reducer: (_prev, next) => next,
    default: () => [],
  }),
});