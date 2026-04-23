"use client";

type ZonePopupProps = {
  zone: string;
  code: string;
  visible: boolean;
};

export function ZonePopup({ zone, code, visible }: ZonePopupProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center bg-black/20 px-5">
      <section className="w-full max-w-md rounded-[2.25rem] border-4 border-warehouse-green bg-white px-6 py-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.36)]">
        <p className="text-xl font-black uppercase tracking-[0.34em] text-warehouse-green">
          Zone
        </p>
        <h2 className="mt-3 break-words text-[7rem] font-black uppercase leading-none text-warehouse-green">
          {zone || "--"}
        </h2>
        <p className="mt-5 break-words text-xl font-black uppercase tracking-widest text-warehouse-ink/70">
          {code}
        </p>
      </section>
    </div>
  );
}
