import React from "react";
import { BRAND, seedWeek } from "./data";
import jsQR from "jsqr";

type Booking = { id: string; sessionId: string; createdAt: string; attendedAt: string | null };

export default function Scan() {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [supported, setSupported] = React.useState<boolean | null>(null);
  const [lastCode, setLastCode] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string>("idle");
  const { sessions } = React.useMemo(seedWeek, []);
  const demoIds = React.useMemo(() => {
    const picks = sessions.slice(0, 2);
    return picks.map((s, i) => ({ bookingId: `b:demo-${i + 1}`, sessionId: s.id }));
  }, [sessions]);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  // URL-scan fallback: if QR encodes a /scan?code=... URL, mark automatically
  React.useEffect(() => {
    const hash = window.location.hash;
    const qIndex = hash.indexOf("?");
    if (qIndex !== -1) {
      const search = new URLSearchParams(hash.slice(qIndex + 1));
      const code = search.get("code");
      if (code) {
        setLastCode(code);
        markAttended(code);
      }
    }
  }, []);

  React.useEffect(() => {
    // Feature detection
    // @ts-ignore
    const ok = !!window.BarcodeDetector;
    setSupported(ok);
  }, []);

  React.useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let running = true;
    let usingDetector = supported === true;
    let detector: any = null;
    (async () => {
      try {
        if (usingDetector) {
          // @ts-ignore
          detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        }
      } catch (e) {
        usingDetector = false;
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
            if (videoRef.current) {
              if (usingDetector && detector) {
                const dets = await detector.detect(videoRef.current);
                if (dets && dets.length) {
                  const raw = dets[0].rawValue as string;
                  handleDecoded(raw);
                }
              } else {
                const v = videoRef.current;
                const w = v.videoWidth;
                const h = v.videoHeight;
                if (w && h) {
                  let canvas = canvasRef.current;
                  if (!canvas) {
                    canvas = document.createElement("canvas");
                    canvasRef.current = canvas;
                  }
                  canvas.width = w;
                  canvas.height = h;
                  const ctx = canvas.getContext("2d");
                  if (ctx) {
                    ctx.drawImage(v, 0, 0, w, h);
                    const img = ctx.getImageData(0, 0, w, h);
                    const code = jsQR(img.data, w, h, { inversionAttempts: "attemptBoth" });
                    if (code && code.data) {
                      handleDecoded(code.data);
                    }
                  }
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

  function handleDecoded(raw: string) {
    setLastCode(raw);
    // Accept both legacy scheme and URL with ?code=
    if (raw.startsWith("openhouse:booking:")) {
      const id = raw.split(":").pop()!;
      markAttended(id);
    } else {
      try {
        const url = new URL(raw);
        const code = url.searchParams.get("code");
        if (code) markAttended(code);
      } catch {}
    }
  }

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
        {status === "camera_error" && (
          <div className="mt-8 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Camera error or insecure context. Use the demo buttons below or open via the device camera.
          </div>
        )}

        <div className="mt-5 grid gap-4">
          <video ref={videoRef} className="w-full rounded-xl bg-black/80 aspect-[3/4] object-cover" muted playsInline />
          <div className="text-[13px] text-gray-600">Point the camera at the QR on the ticket.</div>
          <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200 text-[13px] text-gray-700">
            One-device demo: tap a demo button to simulate a scan:
            <div className="mt-2 flex gap-2 flex-wrap">
              {demoIds.map((d, idx) => (
                <button key={d.bookingId} className="px-3 h-9 rounded-full bg-[var(--brand)] text-white text-sm" onClick={() => {
                  // Simulate scanning the same payload as ticket QR
                  const payload = `openhouse:booking:${d.bookingId}`;
                  setLastCode(payload);
                  markAttended(d.bookingId);
                }}>Scan Demo Ticket {idx+1}</button>
              ))}
            </div>
          </div>
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
