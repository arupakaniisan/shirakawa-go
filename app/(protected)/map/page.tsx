"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import StatusPanel from "@/components/StatusPanel";
import UpdateFab from "@/components/UpdateFab";
import { getVehicles, type Vehicle } from "@/lib/vehicleStorage";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

type DevicePosition = {
  vehicleId: string;
  latitude: number;
  longitude: number;
  receivedAt: string;
};

const STALE_THRESHOLD_MINUTES = 10;

function MapContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const vehicleId = searchParams.get("vehicleId") ?? "";
  const isViewer = vehicleId === "viewer";

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [positions, setPositions] = useState<DevicePosition[]>([]);

  const fetchPositions = useCallback(async () => {
    const res = await fetch("/api/location/fetch");
    if (res.ok) setPositions(await res.json());
  }, []);

  useEffect(() => {
    setVehicles(getVehicles());
    fetchPositions();
  }, [fetchPositions]);

  return (
    <>
      <MapView vehicles={vehicles} positions={positions} />
      <button
        onClick={() => router.back()}
        style={{
          position: "absolute",
          top: 16,
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
      <StatusPanel
        vehicles={vehicles}
        positions={positions}
        staleThresholdMinutes={STALE_THRESHOLD_MINUTES}
      />
      <UpdateFab
        vehicleId={vehicleId}
        isViewer={isViewer}
        onUpdated={fetchPositions}
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
