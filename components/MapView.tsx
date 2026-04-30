"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

const ZOOM_OVERRIDES: { pattern: string; minZoom: number }[] = [
  // zoom 3〜4: 国境・都道府県境
  // { pattern: "admin",              minZoom: 0  }, // 国名、都道府県名などの行政区画のラベル
  // { pattern: "boundary",           minZoom: 0  }, // 国境、県境、市区町村境などの境界線

  // zoom 5〜6: 大都市名・大きな湖・海の名前
  // { pattern: "place-city",         minZoom: 0  }, // 政令指定都市や主要な市など、大きな都市の名前
  // { pattern: "place-state",        minZoom: 4  }, // 州や都道府県などの広域な行政地名
  // { pattern: "water",              minZoom: 0  }, // 海、湖、大きな池などの水域の名前

  // zoom 7〜8: 中規模都市・高速道路・山名
  // { pattern: "place",              minZoom: 7  }, // 上記で未マッチの一般的な地名（市町村など）の fallback
  // { pattern: "settlement",         minZoom: 7  }, // 人の居住地、集落の名前
  // { pattern: "highway",            minZoom: 0  }, // 高速道路や主要国道などの大きな道路のラベルや盾アイコン
  // { pattern: "peak",               minZoom: 8  }, // 山の頂上（山名や標高など）

  // zoom 9〜10: 町名・鉄道路線・公園・河川
  // { pattern: "place-town",         minZoom: 9  }, // 町や村などの比較的小さな自治体の名前
  // { pattern: "railway",            minZoom: 9  }, // 鉄道路線、線路のラベル
  // { pattern: "transit",            minZoom: 9  }, // 交通機関（バス路線など）や乗り換え案内関連
  // { pattern: "waterway",           minZoom: 9  }, // 川や運河などの水路の名前
  // { pattern: "park",               minZoom: 10 }, // 国立公園や大きな都市公園などの名前
  // { pattern: "nature",             minZoom: 10 }, // 自然保護区や景勝地などの名前
  // { pattern: "forest",             minZoom: 10 }, // 森林、林などの樹木エリアの名前

  // zoom 11〜12: 丁目・駅名・幹線道路
  // { pattern: "place-neighborhood", minZoom: 11 }, // 〇〇丁目、〇〇町などの細かい地区・町域の名前
  // { pattern: "place-suburb",       minZoom: 11 }, // 市の郊外や区の名前など（市より小さく町より大きいエリア）
  // { pattern: "station",            minZoom: 11 }, // 電車や地下鉄の駅名、駅のアイコン
  // { pattern: "road",               minZoom: 5  }, // 一般道、県道、市道など、highway以外の道路名

  // zoom 13〜14: お店・施設・細い道
     { pattern: "poi",                minZoom: 11 }, // Point of Interest（コンビニ、飲食店、病院、学校などの施設・お店）

  // zoom 14〜15: 建物・番地
  // { pattern: "building",           minZoom: 14 }, // 建物の名前や、3Dポリゴンに対するラベル
  // { pattern: "address",            minZoom: 15 }, // 番地、号などの一番詳細な住所表示の数字
];

export default function MapView({ vehicles, positions }: Props) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isSatellite, setIsSatellite] = useState(false);
  const hasInitialFlyRef = useRef(false);
  const isInitialMountRef = useRef(true);

  const apiKey = process.env.NEXT_PUBLIC_MAP_API_KEY!;
  const region = process.env.NEXT_PUBLIC_AWS_REGION ?? "ap-northeast-1";

  const getStyleUrl = useCallback(
    (satellite: boolean) => {
      const styleName = satellite ? "Satellite" : "Standard";
      return (
        `https://maps.geo.${region}.amazonaws.com/v2/styles/${styleName}/descriptor` +
        `?key=${apiKey}`
      );
    },
    [apiKey, region]
  );

  const applyStyleCustomizations = useCallback(() => {
    if (!mapRef.current) return;
    const style = mapRef.current.getStyle();

    style.layers.forEach((layer) => {
      if (layer.type === "symbol") {
        const layout = layer.layout as Record<string, unknown> | undefined;
        if (layout?.["text-field"]) {
          mapRef.current!.setLayoutProperty(layer.id, "text-field", [
            "coalesce",
            ["get", "name:ja"],
            ["get", "name"],
          ]);
        }

        // 道路番号の盾アイコン（青い逆三角・緑の長方形）を除去して番号だけ残す
        // 大文字小文字を問わず highway / road / shield / route を含むレイヤーを対象
        const id = layer.id.toLowerCase();
        if (
          id.includes("highway") ||
          id.includes("road") ||
          id.includes("shield") ||
          id.includes("route")
        ) {
          mapRef.current!.setLayoutProperty(layer.id, "icon-image", null);
          mapRef.current!.setPaintProperty(layer.id, "text-color", "#333333");
          mapRef.current!.setPaintProperty(layer.id, "text-halo-color", "#FFFFFF");
          mapRef.current!.setPaintProperty(layer.id, "text-halo-width", 2);
        }
      }

      for (const { pattern, minZoom } of ZOOM_OVERRIDES) {
        if (layer.id.includes(pattern)) {
          mapRef.current!.setLayerZoomRange(layer.id, minZoom, layer.maxzoom || 24);
          break;
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: containerRef.current,
      style: getStyleUrl(false),
      center: [136.9, 35.5],
      zoom: 7,
    });

    mapRef.current.on("load", () => {
      applyStyleCustomizations();
      setMapLoaded(true);
    });

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    if (!mapRef.current) return;

    mapRef.current.setStyle(getStyleUrl(isSatellite));
    mapRef.current.once("style.load", () => {
      applyStyleCustomizations();
    });
  }, [isSatellite, getStyleUrl, applyStyleCustomizations]);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current || positions.length === 0 || hasInitialFlyRef.current) return;

    hasInitialFlyRef.current = true;

    const lngSum = positions.reduce((s, p) => s + p.longitude, 0);
    const latSum = positions.reduce((s, p) => s + p.latitude, 0);
    const centerLng = lngSum / positions.length;
    const centerLat = latSum / positions.length;

    mapRef.current.flyTo({
      center: [centerLng, centerLat],
      zoom: 13,
      bearing: 0,
      pitch: 0,
      duration: 1200,
    });
  }, [mapLoaded, positions]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <button
        onClick={() => setIsSatellite((prev) => !prev)}
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1,
          padding: "6px 12px",
          background: "white",
          border: "1px solid rgba(0,0,0,0.2)",
          borderRadius: "4px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 500,
          color: "#333",
          userSelect: "none",
        }}
      >
        {isSatellite ? "地図" : "航空写真"}
      </button>
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
    </div>
  );
}
