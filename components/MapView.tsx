"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import VehicleMarker from "./VehicleMarker";
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

export default function MapView({ vehicles, positions }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const apiKey = process.env.NEXT_PUBLIC_MAP_API_KEY!;
    const region = process.env.NEXT_PUBLIC_AWS_REGION ?? "ap-northeast-1";
    const styleUrl =
      `https://maps.geo.${region}.amazonaws.com/v2/styles/Standard/descriptor` +
      `?key=${apiKey}`;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: styleUrl,
      center: [136.9, 35.5],
      zoom: 7,
    });

    mapRef.current.on("load", () => setMapLoaded(true));

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {mapLoaded &&
        mapRef.current &&
        positions.map((pos) => {
          const vehicle = vehicles.find((v) => v.id === pos.vehicleId);
          if (!vehicle) return null;
          return (
            <VehicleMarker
              key={pos.vehicleId}
              map={mapRef.current!}
              vehicle={vehicle}
              latitude={pos.latitude}
              longitude={pos.longitude}
            />
          );
        })}
    </>
  );
}
