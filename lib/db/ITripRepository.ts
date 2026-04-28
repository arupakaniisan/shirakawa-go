// Phase 2〜: 旅行リポジトリの抽象インターフェース
export type Trip = {
  id: string;
  name: string;
  startedAt: string;
  endedAt: string | null;
  createdAt: string;
};

export interface ITripRepository {
  createTrip(trip: Omit<Trip, "id" | "createdAt">): Promise<Trip>;
  getTripById(id: string): Promise<Trip | null>;
  listTrips(): Promise<Trip[]>;
  updateTrip(id: string, data: Partial<Trip>): Promise<Trip>;
  deleteTrip(id: string): Promise<void>;
}
