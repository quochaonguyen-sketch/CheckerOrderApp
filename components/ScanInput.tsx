"use client";

import type { ClipboardEvent, FormEvent, RefObject } from "react";

type ScanInputProps = {
  value: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onPasteCode: (value: string) => void;
  onRefocus: () => void;
  onSubmit: () => void;
};

export function ScanInput({
  value,
  inputRef,
  onChange,
  onPasteCode,
  onRefocus,
  onSubmit,
}: ScanInputProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pastedText = event.clipboardData.getData("text");

    if (!pastedText.trim()) {
      return;
    }

    event.preventDefault();
    onPasteCode(pastedText);
  }

  return (
    <form className="w-full" onSubmit={handleSubmit}>
      <label
        htmlFor="scan-code"
        className="mb-2 block text-center text-sm font-black uppercase tracking-[0.2em] text-warehouse-ink/70 md:text-base"
      >
        Quét mã đơn
      </label>
      <input
        id="scan-code"
        ref={inputRef}
        value={value}
        autoFocus
        autoCapitalize="characters"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
        enterKeyHint="done"
        aria-label="Ô quét mã đơn"
        placeholder="Đưa máy quét vào đây"
        className="h-10 w-full rounded-[0.9rem] border-2 border-warehouse-ink bg-white px-3 text-center text-lg font-black uppercase tracking-wide text-warehouse-ink shadow-card outline-none transition focus:border-warehouse-green focus:ring-4 focus:ring-warehouse-green/20 sm:h-12 sm:rounded-[1rem] sm:px-4 sm:text-xl md:h-16 md:text-3xl"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onRefocus}
        onPaste={handlePaste}
      />
      <p className="mt-2 text-center text-xs font-semibold text-warehouse-ink/60 sm:text-sm md:text-base">
        PDA/máy quét gửi Enter hoặc Tab sẽ tự tra cứu liên tục.
      </p>
    </form>
  );
}
