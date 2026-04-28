"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Vehicle } from "@/lib/vehicleStorage";

type Props = {
  map: maplibregl.Map;
  vehicle: Vehicle;
  latitude: number;
  longitude: number;
};

export default function VehicleMarker({ map, vehicle, latitude, longitude }: Props) {
  const markerRef = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    const el = document.createElement("div");
    el.style.width = "16px";
    el.style.height = "16px";
    el.style.borderRadius = "50%";
    el.style.backgroundColor = vehicle.color;
    el.style.border = "2px solid white";

    markerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([longitude, latitude])
      .addTo(map);

    return () => {
      markerRef.current?.remove();
    };
  }, [map, vehicle.color]);

  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [latitude, longitude]);

  return null;
}
