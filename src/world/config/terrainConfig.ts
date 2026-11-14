export type RoadMode = 'ENDLESS' | 'FIXED_5KM';

export interface TerrainConfig {
  seed: string;
  chunkSize: number;       // 128 meters
  segments: number;        // 128 (grid is 129x129 vertices)
  maxHeight: number;       // 280 meters
  trailWidth: number;      // 7.0 meters (standard mountain bench-cut trail)
  trailBlendWidth: number; // 15.0 meters (shoulder blend into mountain slope)
  riverLevel: number;      // -4.0 meters
  viewRadiusChunks: number;
  roadMode: RoadMode;
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  seed: 'OVER_THE_HILL_WASTELAND_01',
  chunkSize: 128,
  segments: 128,
  maxHeight: 280,
  trailWidth: 7.0,
  trailBlendWidth: 15.0,
  riverLevel: -4.0,
  viewRadiusChunks: 3,
  roadMode: 'ENDLESS',
};
