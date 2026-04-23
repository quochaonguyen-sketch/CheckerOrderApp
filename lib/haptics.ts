"use client";

export function vibrateOnce(duration = 80) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(duration);
}
