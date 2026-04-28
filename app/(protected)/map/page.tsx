"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import MapView from "@/components/MapView";
import StatusPanel from "@/components/StatusPanel";
import UpdateFab from "@/components/UpdateFab";
import { getVehicles, type Vehicle } from "@/lib/vehicleStorage";

type DevicePosition = {
  vehicleId: string;
  latitude: number;
  longitude: number;
  receivedAt: string;
};

const STALE_THRESHOLD_MINUTES = 10;

export default function MapPage() {
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
    <main style={{ position: "relative", height: "100dvh" }}>
      <Suspense>
        <MapView />
        <StatusPanel
          vehicles={vehicles}
          positions={positions}
          staleThresholdMinutes={STALE_THRESHOLD_MINUTES}
        />
        <UpdateFab
          vehicleId={vehicles[0]?.id ?? ""}
          isViewer={false}
          onUpdated={fetchPositions}
        />
      </Suspense>
    </main>
  );
}
