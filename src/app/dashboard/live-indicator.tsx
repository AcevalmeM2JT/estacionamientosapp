"use client";

import { useAutoRefresh } from "@/components/auto-refresh";

export function DashboardLiveIndicator() {
  useAutoRefresh(15000);
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      Datos en vivo — actualización cada 15s
    </div>
  );
}
