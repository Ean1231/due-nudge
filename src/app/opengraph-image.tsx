import { ImageResponse } from "next/og";

export const alt = "DueNudge follows up on unpaid invoices";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f4f1ea",
          color: "#17211e",
          padding: "72px",
        }}
      >
        <div style={{ fontSize: 36, letterSpacing: 2 }}>DUENUDGE</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>
          Get the money you already invoiced.
        </div>
        <div style={{ fontSize: 28 }}>Reminders now, then 3, 7, and 14 days after the due date.</div>
      </div>
    ),
    { ...size },
  );
}
