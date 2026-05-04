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
      <section className="w-full max-w-xs rounded-[1.1rem] border-2 border-warehouse-green bg-white px-3 py-4 text-center shadow-[0_18px_50px_rgba(0,0,0,0.3)]">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-warehouse-green">
          Zone
        </p>
        <h2 className="mt-2 break-words text-[3.5rem] font-black uppercase leading-none text-warehouse-green">
          {zone || "--"}
        </h2>
        <p className="mt-3 break-words text-sm font-black uppercase tracking-[0.16em] text-warehouse-ink/70">
          {code}
        </p>
      </section>
    </div>
  );
}
