"use client";

import { useEffect } from "react";

const RECOVERY_KEY = "thetala:chunk-recovery";

function shouldRecover(message: string) {
  const value = message.toLowerCase();

  return (
    value.includes("chunkloaderror") ||
    value.includes("loading chunk") ||
    value.includes("loading css chunk") ||
    value.includes("failed to fetch dynamically imported module") ||
    value.includes("importing a module script failed") ||
    value.includes("unexpected token '<'")
  );
}

export default function ChunkRecovery() {
  useEffect(() => {
    const recover = () => {
      try {
        if (sessionStorage.getItem(RECOVERY_KEY) === "1") return;
        sessionStorage.setItem(RECOVERY_KEY, "1");
        window.location.reload();
      } catch {
        // Ignore storage failures; the page should remain usable.
      }
    };

    const onError = (event: ErrorEvent) => {
      const message =
        event.message ||
        event.error?.message ||
        event.error?.name ||
        "";

      if (shouldRecover(message)) recover();
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        typeof reason === "string"
          ? reason
          : reason?.message || reason?.name || "";

      if (shouldRecover(String(message))) recover();
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener(
        "unhandledrejection",
        onUnhandledRejection
      );
    };
  }, []);

  return null;
}
