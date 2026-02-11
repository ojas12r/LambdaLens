export interface CostSpike {
  functionName: string;
  percentage: number;
  arn: string;
  currentCost: number;
  previousCost: number;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  level: "INFO" | "WARN" | "ERROR";
  requestId?: string;
  duration?: number;
}

export interface AnomalyRecord {
  id: string;
  function_name: string;
  arn: string;
  cost_increase_pct: number;
  current_cost: number;
  previous_cost: number;
  root_cause: string | null;
  status: "detected" | "investigating" | "resolved" | "dismissed";
  created_at: string;
  resolved_at: string | null;
  agent_explanation: string | null;
  suggested_fix: string | null;
  confidence: number | null;
}

export interface DetectiveFinding {
  anomalyId: string;
  functionName: string;
  costIncrease: number;
  rootCause: string;
  explanation: string;
  suggestedFix: string;
  confidence: number;
  timestamp: string;
}