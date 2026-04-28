import { NextResponse } from "next/server";
import { listDevicePositions } from "@/lib/locationClient";

export async function GET() {
  const positions = await listDevicePositions();
  return NextResponse.json(positions);
}
