import React from "react";
import { BRAND } from "./data";

type Booking = { id: string; sessionId: string; createdAt: string; attendedAt: string | null };

export default function Scan() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [lastCode, setLastCode] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("idle");

  React.useEffect(() => {
    // Feature detection
    // @ts-ignore
    const ok = !!window.BarcodeDetector;
    setSupported(ok);
  }, []);

  React.useEffect(() => {
    if (supported === false) return;
    let stream: MediaStream | null = null;
    let raf = 0;
    let detector: any = null;
    let running = true;
    (async () => {
      try {
        // @ts-ignore
        detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) {
        setSupported(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const tick = async () => {
          if (!running) return;
          try {
            if (videoRef.current && detector) {
              const dets = await detector.detect(videoRef.current);
              if (dets && dets.length) {
                const raw = dets[0].rawValue as string;
                setLastCode(raw);
                if (raw.startsWith("openhouse:booking:")) {
                  const id = raw.split(":").pop()!;
                  markAttended(id);
                }
              }
            }
          } catch {}
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      } catch (err) {
        setStatus("camera_error");
      }
    })();
    return () => {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [supported]);

  function markAttended(bookingId: string) {
    const list: Booking[] = JSON.parse(localStorage.getItem("bookings") || "[]");
    const idx = list.findIndex((b) => b.id === bookingId);
    if (idx >= 0) {
      if (!list[idx].attendedAt) {
        list[idx].attendedAt = new Date().toISOString();
        localStorage.setItem("bookings", JSON.stringify(list));
        setStatus("marked");
      } else {
        setStatus("already_marked");
      }
    } else {
      setStatus("not_found");
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50" style={{ ["--brand" as any]: BRAND } as React.CSSProperties}>
      <header className="sticky top-0 z-40 bg-gradient-to-b from-[var(--brand)] to-[var(--brand)]/90 text-white">
        <div className="px-4 pt-6 pb-5 flex items-center gap-3">
          <button onClick={() => (window.location.hash = "#/" )} className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center">←</button>
          <div className="text-xl font-semibold">scanner</div>
        </div>
      </header>

      <main className="px-4 pb-24">
        {supported === false && (
          <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            This browser doesn’t support in-page scanning. Use Chrome on Android, or mark attendance manually.
          </div>
        )}

        <div className="mt-5 grid gap-4">
          <video ref={videoRef} className="w-full rounded-xl bg-black/80 aspect-[3/4] object-cover" muted playsInline />
          <div className="text-[13px] text-gray-600">Point the camera at the QR on the ticket.</div>
          {lastCode && (
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[13px] text-gray-700">
              Last code: <span className="font-mono break-all">{lastCode}</span>
            </div>
          )}
          {status !== "idle" && (
            <div className="p-3 rounded-lg border text-[13px] "
              style={{ borderColor: status === "marked" ? "#10b981" : status === "already_marked" ? "#6366f1" : status === "not_found" ? "#ef4444" : "#e5e7eb", background: "#fff" }}
            >
              {status === "marked" && "Attendance marked!"}
              {status === "already_marked" && "Already marked earlier."}
              {status === "not_found" && "Booking not found on this device."}
              {status === "camera_error" && "Camera error. Check permissions."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

