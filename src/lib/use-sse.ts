"use client";

import { useEffect, useRef, useState } from "react";

interface VehicleEvent {
  id: string;
  license_plate: string;
  entry_time: string;
  is_subscriber: boolean;
}

interface AvailabilityEvent {
  parkingId: string;
  parkedCount: number;
  availableSpots: number;
  totalSpots: number;
}

export function useAvailabilitySSE(parkingId: string | null) {
  const [availability, setAvailability] = useState<AvailabilityEvent | null>(null);
  const [vehicles, setVehicles] = useState<VehicleEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const params = parkingId ? `?parkingId=${parkingId}` : "";
    const es = new EventSource(`/api/sse${params}`);
    eventSourceRef.current = es;

    es.addEventListener("connected", () => setConnected(true));

    es.addEventListener("availability", (e) => {
      setAvailability(JSON.parse(e.data));
    });

    es.addEventListener("vehicles", (e) => {
      const data = JSON.parse(e.data);
      setVehicles(data.vehicles);
    });

    es.addEventListener("error", () => {
      setConnected(false);
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [parkingId]);

  return { availability, vehicles, connected };
}
