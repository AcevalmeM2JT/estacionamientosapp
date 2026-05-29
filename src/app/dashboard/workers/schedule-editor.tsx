"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveWorkerSchedule } from "@/lib/actions/schedule";

const DAYS = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mié" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sáb" },
];

interface ScheduleEntry {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Props {
  workerId: string;
  workerName: string;
  initial: ScheduleEntry[];
}

export function ScheduleEditor({ workerId, workerName, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addDay(day: number) {
    if (schedules.some((s) => s.day_of_week === day)) return;
    setSchedules([...schedules, { day_of_week: day, start_time: "09:00", end_time: "18:00" }]);
  }

  function removeDay(day: number) {
    setSchedules(schedules.filter((s) => s.day_of_week !== day));
  }

  function updateTime(day: number, field: "start_time" | "end_time", value: string) {
    setSchedules(schedules.map((s) => (s.day_of_week === day ? { ...s, [field]: value } : s)));
  }

  async function handleSave() {
    setError(null);
    setLoading(true);
    const result = await saveWorkerSchedule(workerId, schedules);
    if (result?.error) {
      setError(result.error);
    } else {
      router.refresh();
      setOpen(false);
    }
    setLoading(false);
  }

  const selectedDays = schedules.map((s) => s.day_of_week);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="px-3 py-1 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
      >
        Horarios
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Horarios de {workerName}
              </h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm mb-4">
                {error}
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              {DAYS.map((d) => {
                const hasDay = selectedDays.includes(d.value);
                return (
                  <button
                    key={d.value}
                    onClick={() => (hasDay ? removeDay(d.value) : addDay(d.value))}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      hasDay
                        ? "bg-indigo-100 border-indigo-300 text-indigo-800"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>

            {schedules.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">
                Seleccioná los días y ajustá los horarios
              </p>
            )}

            <div className="space-y-2 mb-6">
              {schedules
                .sort((a, b) => a.day_of_week - b.day_of_week)
                .map((s) => {
                  const dayLabel = DAYS.find((d) => d.value === s.day_of_week)?.label ?? "";
                  return (
                    <div key={s.day_of_week} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-2">
                      <span className="text-sm font-medium text-gray-700 w-10">{dayLabel}</span>
                      <input
                        type="time"
                        value={s.start_time}
                        onChange={(e) => updateTime(s.day_of_week, "start_time", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-gray-400 text-sm">a</span>
                      <input
                        type="time"
                        value={s.end_time}
                        onChange={(e) => updateTime(s.day_of_week, "end_time", e.target.value)}
                        className="flex-1 px-2 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <button
                        onClick={() => removeDay(s.day_of_week)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar horarios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
