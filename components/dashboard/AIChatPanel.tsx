"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, X } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Why did image-processor-prod spike 340%?",
  "Which functions are at risk of overspending?",
  "Summarize all active anomalies",
  "What are the top 3 cost optimization opportunities?",
];

function generateMockResponse(query: string): string {
  const q = query.toLowerCase();

  if (q.includes("image-processor") || q.includes("340")) {
    return `**image-processor-prod** — 340% cost spike

**Root Cause:** S3 GetObject timeouts are triggering an infinite retry loop through the SQS dead-letter queue.

**Evidence:**
• 847 CloudWatch events, 312 ERRORs
• All errors: \`S3 timeout: Failed to get object\`
• DLQ redrive policy has unlimited retries

**Impact:** ~$110/day if unchecked

**Fix:**
1. Set \`maxReceiveCount: 5\` on the SQS queue
2. Add circuit breaker with max 3 S3 retries
3. Add CloudWatch alarm on DLQ depth

**Confidence:** 92%`;
  }

  if (q.includes("risk") || q.includes("overspend")) {
    return `Based on current trends, these functions are at risk:

1. **payment-webhook-handler** — 180% spike detected, not yet investigated
2. **data-pipeline-etl** — 250% spike, investigation in progress (6x invocation increase)

I recommend prioritizing payment-webhook-handler since it handles financial transactions and the cost trajectory is steep.`;
  }

  if (q.includes("active") || q.includes("anomal")) {
    return `**Active Anomalies Summary:**

**payment-webhook-handler** — 180% increase ($30 → $84), status: detected
**data-pipeline-etl** — 250% increase ($30 → $105), status: investigating

2 resolved in the last 24h, 1 dismissed (expected traffic).`;
  }

  if (q.includes("optim") || q.includes("top 3") || q.includes("opportunit")) {
    return `**Top 3 Optimization Opportunities:**

1. **Enable provisioned concurrency** for user-auth-service — cold starts cost ~$11/day extra during deployments
2. **Increase S3 timeout** and add VPC Gateway endpoint for image-processor — eliminates retry storms
3. **Batch size tuning** for search-indexer — reverting to 500 saves ~$8/day

Estimated monthly savings: **~$870**`;
  }

  return `I analyzed your query. Based on the current data:

• Total spend (24h): ~$389.60 across 7 functions
• 2 active anomalies need attention
• 3 were resolved in the last 24 hours

Would you like me to investigate a specific function or provide optimization recommendations?`;
}

const MarkdownComponents = {
  p: ({ children }: any) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
  code: ({ inline, children, ...props }: any) => {
    if (inline) {
      return <code className="bg-slate-800 text-aegis-300 px-1 py-0.5 rounded text-[11px] font-mono leading-none">{children}</code>;
    }
    return (
      <pre className="bg-[#0A0A0A] p-3 rounded-xl border border-slate-800/80 overflow-x-auto text-[11px] font-mono my-3 text-slate-300 shadow-inner">
        <code {...props}>{children}</code>
      </pre>
    );
  },
  a: ({ children, href }: any) => <a href={href} target="_blank" rel="noreferrer" className="text-aegis hover:text-aegis-300 underline underline-offset-2">{children}</a>
};

export function AIChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "I'm the Aegis AI. Ask me about cost anomalies, root causes, or optimization opportunities.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDemoMode(document.cookie.includes("aegis_provider=mock"));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Call the Gemini-powered chat API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: text.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("No response received");
        }
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `API error ${res.status}`);
      }
    } catch (err) {
      if (isDemoMode) {
        // Mock fallback ONLY when explicitly using the mock provider
        const response = generateMockResponse(text);
        setMessages((prev) => [...prev, { role: "assistant", content: response }]);
      } else {
        // Display real errors when not in demo mode
        const errorMessage = err instanceof Error ? err.message : "Failed to connect to AI";
        setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMessage}` }]);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Toggle button */}
      <button
        id="chat"
        onClick={() => setOpen(!open)}
        className={`fixed bottom-20 lg:bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-2xl shadow-aegis/25 flex items-center justify-center transition-all hover:scale-105 ${
          open
            ? "bg-slate-700 text-white"
            : "bg-aegis text-white animate-pulse hover:animate-none"
        }`}
      >
        {open ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-36 lg:bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-48px)] rounded-2xl border border-slate-700 bg-[#101010] shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          style={{ height: "min(520px, calc(100vh - 200px))" }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-700/50 bg-[#0C0C0C]">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800 border border-slate-700">
                <Bot className="w-4 h-4 text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Detective AI</p>
                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-dark p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-aegis text-white rounded-br-md"
                      : "bg-[#0C0C0C] text-slate-300 border border-slate-700/50 rounded-bl-md"
                  }`}
                >
                  {msg.role === "user" ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-slate-300 markdown-body">
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={MarkdownComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#0C0C0C] text-slate-400 border border-slate-700/50 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-slate-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-[10px] px-2.5 py-1.5 rounded-full border border-slate-700 text-slate-400 hover:border-aegis hover:text-aegis-300 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-slate-700/50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask about your costs…"
                className="flex-1 rounded-xl bg-[#0C0C0C] border border-slate-700 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-aegis transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="px-3.5 rounded-xl bg-aegis text-white text-sm font-medium hover:bg-aegis-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}