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
};

function haversineDistance(a: DevicePosition, b: DevicePosition): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinDLon * sinDLon;
  return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1 - c));
}

function formatDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

function elapsedMinutes(receivedAt: string): number {
  return (Date.now() - new Date(receivedAt).getTime()) / 1000 / 60;
}

function hasRecentCommunication(
  positions: DevicePosition[],
  excludeVehicleId: string,
  withinMinutes: number
): boolean {
  return positions.some(
    (p) => p.vehicleId !== excludeVehicleId && elapsedMinutes(p.receivedAt) <= withinMinutes
  );
}

export default function StatusPanel({ vehicles, positions }: Props) {
  const posA = positions[0];
  const posB = positions[1];
  const distance =
    posA && posB ? haversineDistance(posA, posB) : null;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        left: 16,
        background: "white",
        padding: 12,
        borderRadius: 8,
        maxWidth: 320,
      }}
    >
      {vehicles.map((v) => {
        const pos = positions.find((p) => p.vehicleId === v.id);
        const elapsed = pos ? elapsedMinutes(pos.receivedAt) : Infinity;
        const warn5 = elapsed > 5;
        const warn30 = elapsed > 30;
        const otherActive = warn30
          ? hasRecentCommunication(positions, v.id, 30)
          : false;

        let textColor = "black";
        if (warn30) textColor = "#c0392b";
        else if (warn5) textColor = "#e67e22";

        return (
          <div key={v.id} style={{ color: textColor, marginBottom: 6 }}>
            <span style={{ color: v.color }}>●</span> {v.name}{" "}
            {pos
              ? `（最終更新: ${new Date(pos.receivedAt).toLocaleTimeString(
                  "ja-JP",
                  { hour: "2-digit", minute: "2-digit" }
                )}）`
              : "（未取得）"}
            {warn30 && pos && (
              <span style={{ display: "block", marginLeft: 20, fontSize: 13 }}>
                🚨 30分以上通信なし
                {otherActive
                  ? "（他車は通信中）"
                  : "（他車も30分以内の通信なし）"}
              </span>
            )}
            {!warn30 && warn5 && pos && (
              <span style={{ display: "block", marginLeft: 20, fontSize: 13 }}>
                ⚠️ 5分以上通信なし
              </span>
            )}
          </div>
        );
      })}
      {distance !== null && distance >= 1000 && (
        <div
          style={{
            marginTop: 8,
            paddingTop: 8,
            borderTop: "1px solid #ddd",
            fontSize: 14,
            color: "#333",
          }}
        >
          車間距離: {formatDistance(distance)}
        </div>
      )}
    </div>
  );
}
