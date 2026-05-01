"use client";

import { useState } from "react";

type Props = {
  vehicleId: string;
  isViewer: boolean;
  onUpdated: () => Promise<void>;
  onError: (msg: string) => void;
};

function gpsErrorMessage(err: GeolocationPositionError): string {
  switch (err.code) {
    case err.PERMISSION_DENIED:
      return "位置情報の使用が許可されていません。設定から許可してください";
    case err.POSITION_UNAVAILABLE:
      return "現在地を取得できませんでした。電波の良い場所へ移動してください";
    case err.TIMEOUT:
      return "位置情報の取得がタイムアウトしました。再度お試しください";
    default:
      return "位置情報の取得に失敗しました";
  }
}

async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit = {},
  timeoutMs = 10000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

export default function UpdateFab({ vehicleId, isViewer, onUpdated, onError }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (!isViewer) {
        let position: GeolocationPosition | null = null;

        try {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000,
            });
          });
        } catch (err) {
          onError(gpsErrorMessage(err as GeolocationPositionError));
          // GPS失敗でも他車両の位置取得は続行する
          await onUpdated();
          return;
        }

        try {
          const res = await fetchWithTimeout("/api/location/update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              vehicleId,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
          if (!res.ok) {
            if (res.status >= 500) {
              onError("サーバーエラーが発生しました。しばらく待ってから再試行してください");
            } else {
              onError(`取得に失敗しました（コード: ${res.status}）`);
            }
          }
        } catch (err) {
          if (err instanceof DOMException && err.name === "AbortError") {
            onError("タイムアウトしました。再度お試しください");
          } else {
            onError("サーバーエラーが発生しました。しばらく待ってから再試行してください");
          }
        }
      }

      await onUpdated();
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
