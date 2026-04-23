"use client";

import type { ScanStatus } from "@/types/lookup";

type StatusPanelProps = {
  status: ScanStatus;
  message: string;
};

const statusStyles: Record<ScanStatus, string> = {
  idle: "border-warehouse-line bg-white text-warehouse-ink",
  loading: "border-warehouse-yellow bg-warehouse-yellow text-warehouse-ink",
  found: "border-warehouse-green bg-warehouse-green text-white",
  "not-found": "border-warehouse-red bg-warehouse-red text-white",
  error: "border-warehouse-red bg-warehouse-red text-white",
};

export function StatusPanel({ status, message }: StatusPanelProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <section
      aria-live="polite"
      className={`w-full rounded-[2rem] border-4 px-6 py-5 text-center text-3xl font-black shadow-card transition md:text-5xl ${statusStyles[status]}`}
    >
      {message}
    </section>
  );
}
