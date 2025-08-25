import React from "react";
import { createQRCode } from "./qrgen";

export default function QR({ value, size = 200 }: { value: string; size?: number }) {
  const qr = React.useMemo(() => createQRCode(value), [value]);
  const n = qr.count;
  const scale = size / n;
  const path: string[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (qr.isDark(r, c)) {
        path.push(`M${(c)*scale},${(r)*scale}h${scale}v${scale}h${-scale}z`);
      }
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="QR code">
      <rect width={size} height={size} fill="#fff" />
      <path d={path.join(" ")} fill="#000" />
    </svg>
  );
}
