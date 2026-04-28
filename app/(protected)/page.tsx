// 車両選択画面
import Link from "next/link";
import { getVehicles } from "@/lib/vehicleStorage";

export default function VehicleSelectPage() {
  const vehicles = getVehicles();

  return (
    <main>
      <h1>乗車する車両を選んでください</h1>
      {vehicles.map((v) => (
        <Link key={v.id} href={`/map?vehicleId=${v.id}`}>
          <button style={{ color: v.color }}>{v.name}のナビ担当</button>
        </Link>
      ))}
      <Link href="/map?vehicleId=viewer">
        <button>見る専用</button>
      </Link>
      <Link href="/settings">
        <button>車両設定</button>
      </Link>
      {/* Phase 2〜 */}
      {/* <Link href="/history"><button>走行履歴</button></Link> */}
    </main>
  );
}
