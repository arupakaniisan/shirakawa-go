// Phase 2〜: 旅行別走行履歴マップ
export default function TripHistoryPage({
  params,
}: {
  params: { tripId: string };
}) {
  return (
    <main>
      <h1>走行履歴 — {params.tripId}</h1>
      <p>TODO: Phase 2 — 走行ルートをマップ上に描画</p>
    </main>
  );
}
