"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
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
      <MapView />
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
