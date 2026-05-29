"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function useAutoRefresh(intervalMs = 15000) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      router.refresh();
    }, intervalMs);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [router, intervalMs]);
}
