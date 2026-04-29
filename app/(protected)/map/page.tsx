"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import StatusPanel from "@/components/StatusPanel";
import UpdateFab from "@/components/UpdateFab";
import Toast from "@/components/Toast";
import { getVehicles, type Vehicle } from "@/lib/vehicleStorage";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type DevicePosition = {
  vehicleId: string;
  latitude: number;
  longitude: number;
  receivedAt: string;
};

const OFFLINE_MSG = "オフラインです。通信が回復するまで更新されません";
const TOAST_DURATION_MS = 4000;

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams.get("vehicleId") ?? "";
  const isViewer = vehicleId === "viewer";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [positions, setPositions] = useState<DevicePosition[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
    };
    const handleOnline = () => {
      setIsOffline(false);
    };

    setIsOffline(!navigator.onLine);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  const fetchPositions = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    try {
      const res = await fetch("/api/location/fetch", { signal: controller.signal });
      if (!res.ok) {
        if (res.status >= 500) {
          showToast("サーバーエラーが発生しました。しばらく待ってから再試行してください");
        } else {
          showToast(`取得に失敗しました（コード: ${res.status}）`);
        }
      } else {
        setPositions(await res.json());
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        showToast("タイムアウトしました。再度お試しください");
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }, [showToast]);

  useEffect(() => {
    setVehicles(getVehicles());
    fetchPositions();
  }, [fetchPositions]);

  const toastMessage = isOffline ? OFFLINE_MSG : toast;

  return (
    <>
      <MapView vehicles={vehicles} positions={positions} />
      <button
        onClick={() => router.back()}
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          zIndex: 10,
          padding: "8px 16px",
          background: "white",
          border: "none",
          borderRadius: 8,
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        ← 戻る
      </button>
      <StatusPanel vehicles={vehicles} positions={positions} />
      <Toast message={toastMessage} />
      <UpdateFab
        vehicleId={vehicleId}
        isViewer={isViewer}
        onUpdated={fetchPositions}
        onError={showToast}
      />
    </>
  );
}

export default function MapPage() {
  return (
    <main style={{ position: "relative", height: "100dvh" }}>
      <Suspense>
        <MapContent />
      </Suspense>
    </main>
  );
}
