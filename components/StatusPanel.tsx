"use client";

import type { Vehicle } from "@/lib/vehicleStorage";

type DevicePosition = {
  vehicleId: string;
  latitude: number;
  longitude: number;
  receivedAt: string;
};

type Props = {
  vehicles: Vehicle[];
  positions: DevicePosition[];
  staleThresholdMinutes: number;
};

function isStale(receivedAt: string, thresholdMinutes: number): boolean {
  const diffMin = (Date.now() - new Date(receivedAt).getTime()) / 1000 / 60;
  return diffMin > thresholdMinutes;
}

export default function StatusPanel({
  vehicles,
  positions,
  staleThresholdMinutes,
}: Props) {
  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        background: "white",
        padding: 12,
        borderRadius: 8,
      }}
    >
      {vehicles.map((v) => {
        const pos = positions.find((p) => p.vehicleId === v.id);
        const stale = pos ? isStale(pos.receivedAt, staleThresholdMinutes) : true;
        return (
          <div
            key={v.id}
            style={{ color: stale ? "gray" : "black", marginBottom: 4 }}
          >
            <span style={{ color: v.color }}>●</span> {v.name}{" "}
            {pos
              ? `（最終更新: ${new Date(pos.receivedAt).toLocaleTimeString(
                  "ja-JP",
                  { hour: "2-digit", minute: "2-digit" }
                )}）`
              : "（未取得）"}
            {stale && pos && " ⚠️ データが古い可能性があります"}
          </div>
        );
      })}
    </div>
  );
}
