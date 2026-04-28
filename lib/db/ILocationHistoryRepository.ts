// Phase 2〜: 位置情報ログリポジトリの抽象インターフェース
export type LocationPoint = {
  id: string;
  tripId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  recordedAt: string;
};

export interface ILocationHistoryRepository {
  savePosition(
    tripId: string,
    position: Omit<LocationPoint, "id" | "tripId">
  ): Promise<void>;
  getPositionsByTrip(tripId: string): Promise<LocationPoint[]>;
  getPositionsByVehicle(
    tripId: string,
    vehicleId: string
  ): Promise<LocationPoint[]>;
}
