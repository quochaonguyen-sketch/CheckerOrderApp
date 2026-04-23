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
        className="mb-4 block text-center text-xl font-black uppercase tracking-[0.28em] text-warehouse-ink/70 md:text-2xl"
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
        className="h-20 w-full rounded-[1.5rem] border-4 border-warehouse-ink bg-white px-5 text-center text-3xl font-black uppercase tracking-wider text-warehouse-ink shadow-card outline-none transition focus:border-warehouse-green focus:ring-8 focus:ring-warehouse-green/20 sm:h-24 sm:rounded-[2rem] sm:px-8 sm:text-4xl md:h-32 md:text-6xl"
        onChange={(event) => onChange(event.target.value)}
        onBlur={onRefocus}
        onPaste={handlePaste}
      />
      <p className="mt-3 text-center text-base font-semibold text-warehouse-ink/60 sm:text-lg md:text-xl">
        PDA/máy quét gửi Enter hoặc Tab sẽ tự tra cứu liên tục.
      </p>
    </form>
  );
}
