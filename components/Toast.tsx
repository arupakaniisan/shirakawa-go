"use client";

type Props = {
  message: string | null;
};

export default function Toast({ message }: Props) {
  if (!message) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: 72,
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,0,0,0.82)",
        color: "white",
        padding: "10px 16px",
        borderRadius: 8,
        fontSize: 14,
        zIndex: 20,
        maxWidth: 300,
        width: "max-content",
        textAlign: "center",
        pointerEvents: "none",
      }}
    >
      {message}
    </div>
  );
}
