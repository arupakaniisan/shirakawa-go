"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import VehicleMarker from "./VehicleMarker";

export default function MapView() {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      {/* TODO: VehicleMarker を positions 数分だけレンダリング */}
    </>
  );
}
