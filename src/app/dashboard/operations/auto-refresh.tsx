"use client";

import { useAutoRefresh } from "@/components/auto-refresh";

export function AutoRefresh() {
  useAutoRefresh(10000);
  return null;
}
