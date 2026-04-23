"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

type CameraScannerProps = {
  onDetected: (code: string) => void;
};

type CameraStatus = "idle" | "starting" | "scanning" | "error";

type BarcodeDetectorLike = {
  detect: (image: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

const BARCODE_FORMATS = [
  "code_128",
  "code_39",
  "code_93",
  "codabar",
  "ean_13",
  "ean_8",
  "itf",
  "qr_code",
  "upc_a",
  "upc_e",
];
const DETECT_INTERVAL_MS = 220;
const SAME_CODE_COOLDOWN_MS = 1800;

export function CameraScanner({ onDetected }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const zxingControlsRef = useRef<IScannerControls | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastDetectedRef = useRef<{ code: string; detectedAt: number } | null>(
    null
  );
  const isScanningRef = useRef(false);

  const [status, setStatus] = useState<CameraStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    zxingControlsRef.current?.stop();
    zxingControlsRef.current = null;

    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("idle");
  }, []);

  const emitDetectedCode = useCallback(
    (rawCode: string) => {
      const code = rawCode.trim();

      if (!code) {
        return;
      }

      const now = Date.now();
      const lastDetected = lastDetectedRef.current;
      const isSameCodeTooSoon =
        lastDetected?.code === code &&
        now - lastDetected.detectedAt < SAME_CODE_COOLDOWN_MS;

      if (isSameCodeTooSoon) {
        return;
      }

      lastDetectedRef.current = { code, detectedAt: now };
      onDetected(code);
    },
    [onDetected]
  );

  const scheduleNextScan = useCallback((callback: () => void) => {
    timerRef.current = window.setTimeout(callback, DETECT_INTERVAL_MS);
  }, []);

  const scanFrame = useCallback(async () => {
    if (!isScanningRef.current || !videoRef.current || !detectorRef.current) {
      return;
    }

    const video = videoRef.current;

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      scheduleNextScan(scanFrame);
      return;
    }

    try {
      const barcodes = await detectorRef.current.detect(video);
      const code = barcodes[0]?.rawValue;

      if (code) {
        emitDetectedCode(code);
      }
    } catch {
      // Một số thiết bị báo lỗi tạm thời khi video chưa sẵn sàng; vòng scan sau sẽ thử lại.
    } finally {
      if (isScanningRef.current) {
        scheduleNextScan(scanFrame);
      }
    }
  }, [emitDetectedCode, scheduleNextScan]);

  const startZxingScanner = useCallback(async () => {
    if (!videoRef.current) {
      throw new Error("Video preview chưa sẵn sàng.");
    }

    const { BrowserMultiFormatReader } = await import("@zxing/browser");
    const reader = new BrowserMultiFormatReader();

    zxingControlsRef.current = await reader.decodeFromConstraints(
      {
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      videoRef.current,
      (result) => {
        const code = result?.getText();

        if (code) {
          emitDetectedCode(code);
        }
      }
    );

    isScanningRef.current = true;
    setStatus("scanning");
  }, [emitDetectedCode]);

  const startCamera = useCallback(async () => {
    if (!window.isSecureContext) {
      setStatus("error");
      setErrorMessage(
        `Camera bị chặn vì web đang chạy không bảo mật (${window.location.origin}). Hãy mở bằng HTTPS như Vercel/ngrok/Cloudflare Tunnel, hoặc localhost trên chính thiết bị.`
      );
      return;
    }

    const Detector = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error");
      setErrorMessage(
        "Trình duyệt chưa cho web mở camera. Hãy dùng Chrome/Edge mới hơn hoặc kiểm tra quyền camera."
      );
      return;
    }

    setStatus("starting");
    setErrorMessage("");

    try {
      if (!Detector) {
        await startZxingScanner();
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        streamRef.current = stream;
        const supportedFormats = await Detector.getSupportedFormats?.();
        const formats = supportedFormats
          ? BARCODE_FORMATS.filter((format) =>
              supportedFormats.includes(format)
            )
          : BARCODE_FORMATS;

        detectorRef.current = new Detector(
          formats.length > 0 ? { formats } : undefined
        );

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        isScanningRef.current = true;
        setStatus("scanning");
        scanFrame();
      } catch {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        detectorRef.current = null;
        await startZxingScanner();
      }
    } catch (error) {
      console.error("Camera scanner failed", error);
      stopCamera();
      setStatus("error");
      setErrorMessage(
        "Không mở được camera. Kiểm tra quyền camera, dùng HTTPS/Vercel hoặc thử Chrome/Edge mới hơn."
      );
    }
  }, [scanFrame, startZxingScanner, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const isCameraOn = status === "starting" || status === "scanning";

  return (
    <section className="w-full rounded-[2rem] border-4 border-warehouse-line bg-white/80 p-4 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xl font-black text-warehouse-ink md:text-2xl">
            Quét bằng camera
          </p>
          <p className="text-sm font-bold text-warehouse-ink/60 md:text-base">
            Dành cho mobile/PDA không dùng scanner keyboard.
          </p>
        </div>

        <button
          type="button"
          className={`rounded-2xl px-6 py-4 text-xl font-black text-white transition ${
            isCameraOn
              ? "bg-warehouse-red active:scale-95"
              : "bg-warehouse-green active:scale-95"
          }`}
          onClick={isCameraOn ? stopCamera : startCamera}
        >
          {isCameraOn ? "Tắt camera" : "Bật camera"}
        </button>
      </div>

      {isCameraOn ? (
        <div className="fixed inset-0 z-50 bg-black">
          <video
            ref={videoRef}
            className="h-[100svh] w-screen object-cover"
            muted
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,transparent_34%,rgba(0,0,0,0.58)_35%,rgba(0,0,0,0.78)_100%)]" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-44 w-[86vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-[2rem] border-4 border-warehouse-yellow shadow-[0_0_32px_rgba(246,195,67,0.7)] sm:h-56" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between gap-3 bg-gradient-to-b from-black/80 to-transparent p-4 text-white">
            <div>
              <p className="text-2xl font-black">Quét camera</p>
              <p className="text-sm font-bold text-white/80">
                {status === "starting"
                  ? "Đang mở camera..."
                  : "Đưa barcode vào khung vàng"}
              </p>
            </div>
            <button
              type="button"
              className="rounded-2xl bg-warehouse-red px-5 py-3 text-lg font-black text-white active:scale-95"
              onClick={stopCamera}
            >
              Tắt
            </button>
          </div>
          <div className="absolute inset-x-4 bottom-5 rounded-3xl bg-white/92 px-5 py-4 text-center text-lg font-black text-warehouse-ink shadow-card">
            Giữ mã trong khung, app sẽ tự đọc zone liên tục
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-base font-bold text-warehouse-red">
          {errorMessage}
        </p>
      ) : null}
    </section>
  );
}
