export interface TerrainConfig {
  seed: string;
  chunkSize: number;       // 128 meters
  segments: number;        // 128 (grid is 129x129 vertices)
  maxHeight: number;       // 85 meters
  trailWidth: number;      // 5.5 meters (wide enough for 1-2 rigs)
  trailBlendWidth: number; // 8.0 meters (smooth shoulder embankment)
  riverLevel: number;      // -4.0 meters
  viewRadiusChunks: number;
}

export const DEFAULT_TERRAIN_CONFIG: TerrainConfig = {
  seed: 'OVER_THE_HILL_WASTELAND_01',
  chunkSize: 128,
  segments: 128,
  maxHeight: 85,
  trailWidth: 5.5,
  trailBlendWidth: 8.0,
  riverLevel: -4.0,
  viewRadiusChunks: 2,
};
