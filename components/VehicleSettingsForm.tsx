"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getVehicles, saveVehicles, type Vehicle } from "@/lib/vehicleStorage";

export default function VehicleSettingsForm() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    setVehicles(getVehicles());
  }, []);

  const updateVehicle = (id: string, patch: Partial<Vehicle>) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
    );
  };

  const handleSave = () => {
    saveVehicles(vehicles);
    alert("保存しました");
  };

  return (
    <div>
      {vehicles.map((v) => (
        <div key={v.id} style={{ marginBottom: 12 }}>
          <label>
            車両 ID: {v.id}
            <input
              type="text"
              value={v.name}
              onChange={(e) => updateVehicle(v.id, { name: e.target.value })}
            />
          </label>
          <input
            type="color"
            value={v.color}
            onChange={(e) => updateVehicle(v.id, { color: e.target.value })}
          />
        </div>
      ))}
      <button onClick={handleSave}>保存</button>
      <button onClick={() => router.back()}>戻る</button>
    </div>
  );
}
