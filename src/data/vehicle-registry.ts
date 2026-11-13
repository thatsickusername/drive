import { VehicleDefinition } from '../types/vehicle';
import vehicleDataRaw from './vehicles.json';

export const VEHICLE_DATABASE: Record<string, VehicleDefinition> = vehicleDataRaw as unknown as Record<string, VehicleDefinition>;

export const DEFAULT_VEHICLE_ID = 'trial_crawler_4x4';

export function getVehicleConfig(id: string = DEFAULT_VEHICLE_ID): VehicleDefinition {
  const vehicle = VEHICLE_DATABASE[id];
  if (!vehicle) {
    const fallback = VEHICLE_DATABASE[DEFAULT_VEHICLE_ID];
    if (!fallback) {
      throw new Error(`Vehicle definition '${id}' and fallback '${DEFAULT_VEHICLE_ID}' not found in registry.`);
    }
    return fallback;
  }
  return vehicle;
}

export function listAvailableVehicles(): Array<{ id: string; name: string; description: string }> {
  return Object.values(VEHICLE_DATABASE).map((v) => ({
    id: v.id,
    name: v.name,
    description: v.description
  }));
}
