// マップダッシュボード
"use client";

import { Suspense } from "react";
import MapView from "@/components/MapView";
import StatusPanel from "@/components/StatusPanel";
import UpdateFab from "@/components/UpdateFab";

export default function MapPage() {
  return (
    <main style={{ position: "relative", height: "100dvh" }}>
      <Suspense>
        <MapView />
        <StatusPanel />
        <UpdateFab />
      </Suspense>
    </main>
  );
}
