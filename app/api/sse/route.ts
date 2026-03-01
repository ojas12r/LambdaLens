import { getRecentAnomalies } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const initial = await getRecentAnomalies(10);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(initial)}\n\n`));
      } catch (err) {
        // ignore
      }

      const interval = setInterval(async () => {
        try {
          const anomalies = await getRecentAnomalies(10);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(anomalies)}\n\n`));
        } catch (err) {
          // ignore
        }
      }, 3000);

      // Clean up when the client disconnects
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
