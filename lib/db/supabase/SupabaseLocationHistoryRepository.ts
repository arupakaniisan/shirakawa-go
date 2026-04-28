// Phase 2: Supabase 実装
import type {
  ILocationHistoryRepository,
  LocationPoint,
} from "../ILocationHistoryRepository";

export class SupabaseLocationHistoryRepository
  implements ILocationHistoryRepository
{
  async savePosition(
    _tripId: string,
    _position: Omit<LocationPoint, "id" | "tripId">
  ): Promise<void> {
    throw new Error("Not implemented");
  }

  async getPositionsByTrip(_tripId: string): Promise<LocationPoint[]> {
    throw new Error("Not implemented");
  }

  async getPositionsByVehicle(
    _tripId: string,
    _vehicleId: string
  ): Promise<LocationPoint[]> {
    throw new Error("Not implemented");
  }
}
