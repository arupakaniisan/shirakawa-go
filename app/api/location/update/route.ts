export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { updateDevicePosition } from "@/lib/locationClient";

export async function POST(req: NextRequest) {
  const { vehicleId, latitude, longitude } = await req.json();

  await updateDevicePosition({ vehicleId, latitude, longitude });

  return NextResponse.json({ ok: true });
}
