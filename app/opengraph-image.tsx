import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "shirakawa-go";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 背景の光の輪 */}
        <div
          style={{
            position: "absolute",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)",
            top: -100,
            right: -100,
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)",
            bottom: -80,
            left: -80,
            display: "flex",
          }}
        />

        {/* 車アイコン列 */}
        <div
          style={{
            display: "flex",
            gap: 40,
            marginBottom: 32,
            fontSize: 56,
          }}
        >
          <span>🚗</span>
          <span>📍</span>
          <span>🚙</span>
          <span>📍</span>
          <span>🚐</span>
        </div>

        {/* メインタイトル */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-2px",
            marginBottom: 12,
            display: "flex",
          }}
        >
          shirakawa-go
        </div>

        {/* キャッチコピー */}
        <div
          style={{
            fontSize: 32,
            fontWeight: 700,
            color: "#a5b4fc",
            marginBottom: 24,
            display: "flex",
          }}
        >
          みんなの車、今どこ？ 一目でわかる。
        </div>

        {/* タグライン */}
        <div
          style={{
            fontSize: 22,
            color: "#cbd5e1",
            display: "flex",
            gap: 24,
          }}
        >
          <span>🎿 スキー合宿</span>
          <span>🏕️ キャンプ</span>
          <span>🎌 旅行</span>
          <span>🎉 イベント</span>
        </div>

        {/* 下部バー */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            width: "100%",
            height: 6,
            background: "linear-gradient(90deg, #6366f1, #ec4899, #f59e0b)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
