// AWS Location Service v2 ラッパー
import {
  LocationClient,
  BatchUpdateDevicePositionCommand,
  ListDevicePositionsCommand,
} from "@aws-sdk/client-location";

const client = new LocationClient({
  region: process.env.AWS_REGION ?? "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const TRACKER_NAME = process.env.AWS_TRACKER_NAME!;

export type DevicePosition = {
  vehicleId: string;
  latitude: number;
  longitude: number;
  receivedAt: string;
};

export async function updateDevicePosition(input: {
  vehicleId: string;
  latitude: number;
  longitude: number;
}): Promise<void> {
  await client.send(
    new BatchUpdateDevicePositionCommand({
      TrackerName: TRACKER_NAME,
      Updates: [
        {
          DeviceId: input.vehicleId,
          Position: [input.longitude, input.latitude],
          SampleTime: new Date(),
        },
      ],
    })
  );
}

export async function listDevicePositions(): Promise<DevicePosition[]> {
  const res = await client.send(
    new ListDevicePositionsCommand({ TrackerName: TRACKER_NAME })
  );

  return (res.Entries ?? []).map((e) => ({
    vehicleId: e.DeviceId!,
    longitude: e.Position![0],
    latitude: e.Position![1],
    receivedAt: e.SampleTime!.toISOString(),
  }));
}
