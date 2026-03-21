"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function SSEAutoRefresh() {
  const router = useRouter();
  const lastState = useRef<string | null>(null);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    // Setup event source
    const eventSource = new EventSource("/api/sse");

    eventSource.onopen = () => {
      retryCount = 0;
    };

    eventSource.onmessage = (event) => {
      // If we already captured a state and the incoming state string changed, hot-reload the UI.
      if (lastState.current !== null && lastState.current !== event.data) {
         router.refresh();
      }
      lastState.current = event.data;
    };

    eventSource.onerror = (err) => {
      retryCount++;
      if (retryCount >= maxRetries) {
        eventSource.close();
        console.warn("SSE Polling aborted due to repeated disconnections.");
      }
    };

    return () => {
      eventSource.close();
    };
  }, [router]);

  return null;
}
