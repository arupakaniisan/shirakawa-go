// Phase 3: DynamoDB 実装
import type { ITripRepository, Trip } from "../ITripRepository";

export class DynamoDBTripRepository implements ITripRepository {
  async createTrip(_trip: Omit<Trip, "id" | "createdAt">): Promise<Trip> {
    throw new Error("Not implemented");
  }

  async getTripById(_id: string): Promise<Trip | null> {
    throw new Error("Not implemented");
  }

  async listTrips(): Promise<Trip[]> {
    throw new Error("Not implemented");
  }

  async updateTrip(_id: string, _data: Partial<Trip>): Promise<Trip> {
    throw new Error("Not implemented");
  }

  async deleteTrip(_id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}
