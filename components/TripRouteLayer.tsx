// Phase 2〜: 走行ルート描画
"use client";

import { useEffect } from "react";
import type maplibregl from "maplibre-gl";

type LocationPoint = {
  vehicleId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

type Props = {
  map: maplibregl.Map;
  vehicleId: string;
  color: string;
  points: LocationPoint[];
  visible: boolean;
};

export default function TripRouteLayer({
  map,
  vehicleId,
  color,
  points,
  visible,
}: Props) {
  useEffect(() => {
    // TODO: Phase 2 — points を LineString として GeoJSON Source/Layer に描画
    // sourceId / layerId は vehicleId ごとにユニーク化
  }, [map, vehicleId, color, points, visible]);

  return null;
}
