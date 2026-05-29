"use client";

import { useAutoRefresh } from "@/components/auto-refresh";

export function AutoRefresh() {
  useAutoRefresh(30000);
  return null;
}
