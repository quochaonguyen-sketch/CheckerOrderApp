"use client";

import type { LookupResponse, ScanStatus } from "@/types/lookup";

type ResultCardProps = {
  result: LookupResponse | null;
  status: ScanStatus;
  lastCode: string;
};

export function ResultCard({ result, status, lastCode }: ResultCardProps) {
  if (status === "loading") {
    return (
      <section className="flex min-h-[11rem] w-full flex-col items-center justify-center rounded-[1.25rem] border-2 border-warehouse-yellow bg-yellow-50 px-4 py-5 text-center shadow-card md:min-h-[14rem]">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-warehouse-yellow border-t-transparent" />
        <p className="mt-3 text-sm font-black uppercase tracking-[0.2em] text-warehouse-ink/70 md:text-lg">
          Đang tra cứu
        </p>
        <p className="mt-2 break-words text-2xl font-black uppercase tracking-widest text-warehouse-ink md:text-4xl">
          {lastCode}
        </p>
      </section>
    );
  }

  if (!result) {
    return (
      <section className="flex min-h-[11rem] w-full items-center justify-center rounded-[1.25rem] border-2 border-dashed border-warehouse-line bg-white/40 px-4 py-5 shadow-card md:min-h-[14rem]">
        <span className="sr-only">Chờ quét mã đơn</span>
      </section>
    );
  }

  if (!result.found) {
    return (
      <section className="flex min-h-[11rem] w-full flex-col items-center justify-center rounded-[1.25rem] border-2 border-warehouse-red bg-red-50 px-4 py-5 text-center shadow-card md:min-h-[14rem]">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-warehouse-red md:text-lg">
          Mã quét
        </p>
        <p className="mt-2 break-words text-6xl font-black uppercase tracking-widest text-warehouse-red md:text-4xl">
          {lastCode}
        </p>
      </section>
    );
  }

  const { data } = result;

  return (
    <section
      className={`flex min-h-[11rem] w-full flex-col items-center justify-center rounded-[1.25rem] border-2 bg-white px-3 py-4 text-center shadow-card md:min-h-[14rem] md:px-5 md:py-5 ${
        status === "found" ? "border-warehouse-green" : "border-warehouse-line"
      }`}
    >
      <p className="text-sm font-black uppercase tracking-[0.2em] text-warehouse-green md:text-lg">
        Zone
      </p>
      <h1 className="mt-2 break-words text-[130px] font-black uppercase leading-none tracking-tight text-warehouse-green mb-5">
        {data.zone || "--"}
      </h1>
      <p className="mt-2 text-base font-black leading-tight text-warehouse-ink md:text-2xl">
        {[data.district, data.ward].filter(Boolean).join(" - ")}
      </p>

      <div className="mt-4 grid w-full gap-2 md:grid-cols-1">
        <InfoBlock label="Mã quét" value={data.code} />
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.8rem] border border-warehouse-line bg-warehouse-paper px-3 py-2 text-center">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-warehouse-ink/50">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-warehouse-ink md:text-lg">
        {value}
      </p>
    </div>
  );
}
