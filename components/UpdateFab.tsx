"use client";

import { useState } from "react";

type Props = {
  vehicleId: string;
  isViewer: boolean;
  onUpdated: () => void;
};

export default function UpdateFab({ vehicleId, isViewer, onUpdated }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!isViewer) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
          });
        });

        await fetch("/api/location/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicleId,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
        });
      }

      onUpdated();
    } catch (err) {
      console.error(err);
      // TODO: GPS / API エラーをトースト表示
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        position: "absolute",
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: "50%",
        fontSize: 24,
      }}
      aria-label="位置を更新"
    >
      {loading ? "…" : "🔄"}
    </button>
  );
}
