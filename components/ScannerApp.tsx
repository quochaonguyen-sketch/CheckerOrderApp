"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { playNotFoundAlert } from "@/lib/alertSound";
import { buildZoneSpeechText, speakText } from "@/lib/speech";
import { vibrateOnce } from "@/lib/haptics";
import { normalizeCode } from "@/lib/normalize";
import type { LookupResponse, ScanStatus } from "@/types/lookup";
import { CameraScanner } from "@/components/CameraScanner";
import { ResultCard } from "@/components/ResultCard";
import { ScanInput } from "@/components/ScanInput";
import { ZonePopup } from "@/components/ZonePopup";

const DUPLICATE_COOLDOWN_MS = 500;
const CAMERA_DUPLICATE_COOLDOWN_MS = 1800;
const SCANNER_BUFFER_RESET_MS = 900;
const ZONE_POPUP_VISIBLE_MS = 1400;

type ScanSource = "scanner" | "camera";

type ScanJob = {
  code: string;
  source: ScanSource;
};

export function ScannerApp() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const queueRef = useRef<ScanJob[]>([]);
  const keyBufferRef = useRef("");
  const keyBufferTimerRef = useRef<number | null>(null);
  const popupTimerRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const lastSubmittedRef = useRef<{ code: string; submittedAt: number } | null>(
    null
  );

  const [scanValue, setScanValue] = useState("");
  const [lastCode, setLastCode] = useState("");
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [result, setResult] = useState<LookupResponse | null>(null);
  const [zonePopup, setZonePopup] = useState({
    visible: false,
    zone: "",
    code: "",
  });

  const focusInput = useCallback(() => {
    window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 0);
  }, []);

  useEffect(() => {
    focusInput();

    return () => {
      abortRef.current?.abort();
      if (keyBufferTimerRef.current) {
        window.clearTimeout(keyBufferTimerRef.current);
      }
      if (popupTimerRef.current) {
        window.clearTimeout(popupTimerRef.current);
      }
      window.speechSynthesis?.cancel();
    };
  }, [focusInput]);

  useEffect(() => {
    function refocusWhenActive() {
      if (!document.hidden) {
        focusInput();
      }
    }

    document.addEventListener("visibilitychange", refocusWhenActive);
    window.addEventListener("focus", refocusWhenActive);
    window.addEventListener("pageshow", refocusWhenActive);

    return () => {
      document.removeEventListener("visibilitychange", refocusWhenActive);
      window.removeEventListener("focus", refocusWhenActive);
      window.removeEventListener("pageshow", refocusWhenActive);
    };
  }, [focusInput]);

  const processQueue = useCallback(async () => {
    if (processingRef.current) {
      return;
    }

    const nextJob = queueRef.current.shift();

    if (!nextJob) {
      return;
    }

    processingRef.current = true;

    const abortController = new AbortController();
    abortRef.current = abortController;

    setLastCode(nextJob.code);
    setStatus("loading");

    try {
      const response = await fetch("/api/lookup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: nextJob.code }),
        signal: abortController.signal,
      });

      const payload = (await response.json()) as
        | LookupResponse
        | { error?: string };

      if (!response.ok) {
        const errorMessage =
          "error" in payload && payload.error
            ? payload.error
            : "Tra cứu thất bại.";

        throw new Error(errorMessage);
      }

      const lookupResult = payload as LookupResponse;
      setResult(lookupResult);

      if (lookupResult.found) {
        setStatus("found");
        if (nextJob.source === "camera") {
          if (popupTimerRef.current) {
            window.clearTimeout(popupTimerRef.current);
          }

          setZonePopup({
            visible: true,
            zone: lookupResult.data.zone,
            code: lookupResult.data.code,
          });

          popupTimerRef.current = window.setTimeout(() => {
            setZonePopup((currentPopup) => ({
              ...currentPopup,
              visible: false,
            }));
          }, ZONE_POPUP_VISIBLE_MS);
        }

        await speakText(buildZoneSpeechText(lookupResult.data.zone), {
          lang: "en-US",
        });
      } else {
        setStatus("not-found");
        await playNotFoundAlert();
        await speakText("Không tìm thấy", {
          lang: "vi-VN",
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setStatus("error");
      setResult(null);
    } finally {
      if (abortRef.current === abortController) {
        abortRef.current = null;
      }

      processingRef.current = false;
      focusInput();

      if (queueRef.current.length > 0) {
        void processQueue();
      }
    }
  }, [focusInput]);

  const enqueueLookup = useCallback((rawCode: string, cooldownMs = DUPLICATE_COOLDOWN_MS, source: ScanSource = "scanner") => {
    const normalizedCode = normalizeCode(rawCode);

    if (inputRef.current) {
      inputRef.current.value = "";
    }

    setScanValue("");
    focusInput();

    if (!normalizedCode) {
      setStatus("idle");
      return;
    }

    const now = Date.now();
    const lastSubmitted = lastSubmittedRef.current;

    if (
      lastSubmitted?.code === normalizedCode &&
      now - lastSubmitted.submittedAt < cooldownMs
    ) {
      return;
    }

    lastSubmittedRef.current = {
      code: normalizedCode,
      submittedAt: now,
    };

    vibrateOnce();

    queueRef.current.push({
      code: normalizedCode,
      source,
    });
    void processQueue();
  }, [focusInput, processQueue]);

  const enqueueCameraLookup = useCallback(
    (rawCode: string) => {
      enqueueLookup(rawCode, CAMERA_DUPLICATE_COOLDOWN_MS, "camera");
    },
    [enqueueLookup]
  );

  const submitLookup = useCallback(() => {
    enqueueLookup(inputRef.current?.value || scanValue);
  }, [enqueueLookup, scanValue]);

  useEffect(() => {
    function resetKeyBufferSoon() {
      if (keyBufferTimerRef.current) {
        window.clearTimeout(keyBufferTimerRef.current);
      }

      keyBufferTimerRef.current = window.setTimeout(() => {
        keyBufferRef.current = "";
      }, SCANNER_BUFFER_RESET_MS);
    }

    function handleGlobalScannerKeys(event: KeyboardEvent) {
      if (event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      const inputValue = inputRef.current?.value.trim() ?? "";
      const shouldSubmit = event.key === "Enter" || event.key === "Tab";

      if (shouldSubmit) {
        const bufferedCode = keyBufferRef.current.trim();
        const code = inputValue || bufferedCode;
        keyBufferRef.current = "";
        focusInput();

        if (code) {
          event.preventDefault();
          enqueueLookup(code);
        }

        return;
      }

      if (event.key.length === 1) {
        keyBufferRef.current += event.key;
        resetKeyBufferSoon();
      }
    }

    window.addEventListener("keydown", handleGlobalScannerKeys, true);

    return () => {
      window.removeEventListener("keydown", handleGlobalScannerKeys, true);
    };
  }, [enqueueLookup, focusInput]);

  return (
    <main
      className="min-h-[100svh] w-full px-3 py-4 text-warehouse-ink sm:px-4 md:px-8 md:py-8"
      onMouseDown={focusInput}
      onTouchStart={focusInput}
    >
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-7xl flex-col items-center justify-center gap-4 md:gap-8">
        <header className="text-center">
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
            Tra cứu
          </h1>
        </header>

        <ScanInput
          value={scanValue}
          inputRef={inputRef}
          onChange={setScanValue}
          onPasteCode={enqueueLookup}
          onRefocus={focusInput}
          onSubmit={submitLookup}
        />

        <CameraScanner onDetected={enqueueCameraLookup} />

        <ResultCard result={result} status={status} lastCode={lastCode} />
        <ZonePopup
          visible={zonePopup.visible}
          zone={zonePopup.zone}
          code={zonePopup.code}
        />
      </div>
    </main>
  );
}
