"use client";

import type { LookupResponse, ScanStatus } from "@/types/lookup";

type ResultCardProps = {
  result: LookupResponse | null;
  status: ScanStatus;
  lastCode: string;
};

export function ResultCard({ result, status, lastCode }: ResultCardProps) {
  if (!result) {
    return (
      <section className="flex min-h-[22rem] w-full items-center justify-center rounded-[2.5rem] border-4 border-dashed border-warehouse-line bg-white/40 px-8 py-10 shadow-card md:min-h-[28rem]">
        {status === "loading" ? (
          <div className="text-center">
            <p className="text-xl font-black uppercase tracking-[0.35em] text-warehouse-yellow md:text-3xl">
              Đang tra
            </p>
            <p className="mt-4 break-words text-5xl font-black uppercase tracking-widest text-warehouse-ink md:text-8xl">
              {lastCode}
            </p>
          </div>
        ) : (
          <span className="sr-only">Chờ quét mã đơn</span>
        )}
      </section>
    );
  }

  if (!result.found) {
    return (
      <section className="flex min-h-[22rem] w-full flex-col items-center justify-center rounded-[2.5rem] border-4 border-warehouse-red bg-red-50 px-8 py-10 text-center shadow-card md:min-h-[28rem]">
        <p className="text-xl font-black uppercase tracking-[0.35em] text-warehouse-red md:text-3xl">
          Mã quét
        </p>
        <p className="mt-4 break-words text-5xl font-black uppercase tracking-widest text-warehouse-red md:text-8xl">
          {lastCode}
        </p>
      </section>
    );
  }

  const { data } = result;

  return (
    <section
      className={`flex min-h-[22rem] w-full flex-col items-center justify-center rounded-[2.5rem] border-4 bg-white px-5 py-8 text-center shadow-card md:min-h-[28rem] md:px-10 md:py-10 ${
        status === "found" ? "border-warehouse-green" : "border-warehouse-line"
      }`}
    >
      <p className="text-xl font-black uppercase tracking-[0.35em] text-warehouse-green md:text-3xl">
        Zone
      </p>
      <h1 className="mt-3 break-words text-[6.5rem] font-black uppercase leading-none tracking-tight text-warehouse-green sm:text-[8rem] md:text-[13rem]">
        {data.zone || "--"}
      </h1>
      <p className="mt-4 text-3xl font-black leading-tight text-warehouse-ink md:text-5xl">
        {[data.district, data.ward].filter(Boolean).join(" - ")}
      </p>

      <div className="mt-8 grid w-full gap-4 md:grid-cols-3">
        <InfoBlock label="Mã quét" value={data.code} />
        <InfoBlock label="Khu vực" value={data.area || data.city || "Không có"} />
        <InfoBlock label="Ghi chú" value={data.note || "Không có"} />
      </div>
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border-2 border-warehouse-line bg-warehouse-paper px-5 py-4 text-center">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-warehouse-ink/50">
        {label}
      </p>
      <p className="mt-2 break-words text-2xl font-black text-warehouse-ink md:text-3xl">
        {value}
      </p>
    </div>
  );
}
