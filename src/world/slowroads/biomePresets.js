// Biome Preset Configurations extracted from Slow Roads
// Defines parameters for Heightmap, Midline Road Surveyor, Foliage, and Texturing for each biome

export const BiomePresets = {
  Hills: {
    id: 'hills',
    name: 'Hills',
    description: 'Rolling green hills, winding countryside roads, drystone walls, and gentle slopes',
    heightmap: {
      seed: '20',
      scale: 120,
      offset: 70,
      layerResolutions: [3, 31],
      squared: false,
      depthHeightFactor: 1.2,
      temper: false,
      temperBase: 0,
      temperBelow: 150,
      temperMin: 0.25,
      tileScaleRandom: 0,
      peakScale: 2.2,
      peakOffset: 0,
      peakDistortFactor: 0.5,
      peakDistortRes: 3,
      peakDistortDepth: 4,
      peakDistortUpscale: 3,
      peakCount: 16,
      peakRadiusMin: 800
    },
    midline: {
      seed: 323,
      feelDist: 4,
      feelAng: 0.6,
      maxTurnDelta: 1.0,
      nodeSpacing: 10,
      panicDist: 10,
      distRange: 0,
      testDist: 20,
      minElev: 2,
      maxGrad: 0.1,
      isStraight: false,
      maxBridgeNodes: 7,
      minBridgeNodes: 3,
      minStartElev: 5,
      maxStartElev: 150,
      genRadius: 0,
      genRadiusMargin: 0,
      genMinRadius: 0,
      curvatureHeightFactor: 5,
      minFineSegs: 1,
      roadSink: 0.4,
      roadWidth: 8,
      curbWidth: 0.4,
      margin: 16
    },
    textures: {
      road: 'textures/road_base.webp',
      grass: 'textures/grass.webp',
      grassBump: 'textures/grass_bump.webp',
      cliff: 'textures/cliff.webp',
      cliffBump: 'textures/cliff_bump.webp',
      rock: 'textures/rock.webp',
      rockBump: 'textures/rock_bump.webp',
      wall: 'textures/wall_drystone.webp'
    }
  },

  OffWorld: {
    id: 'offworld',
    name: 'OffWorld',
    description: 'Alien crimson red plains, cratered terrain, low gravity, and modern crash barriers',
    heightmap: {
      seed: '20',
      scale: 90,
      offset: 50,
      layerResolutions: [3, 20],
      squared: true,
      depthHeightFactor: 1.0,
      temper: true,
      temperBase: 10,
      temperBelow: 120,
      temperMin: 0.3,
      tileScaleRandom: 0.2
    },
    midline: {
      seed: 450,
      feelDist: 6,
      feelAng: 0.5,
      maxTurnDelta: 0.8,
      nodeSpacing: 10,
      panicDist: 12,
      testDist: 25,
      minElev: 2,
      maxGrad: 0.15,
      curvatureHeightFactor: 4,
      roadWidth: 10,
      curbWidth: 0.5,
      margin: 20
    },
    textures: {
      road: 'textures/road_single_wide.webp',
      ground: 'textures/surface_rego.webp',
      groundBump: 'textures/surface_bump.webp',
      rock: 'textures/rock.webp',
      rockBump: 'textures/rock_bump.webp',
      wall: 'textures/venus_barrier.webp'
    }
  },

  Woods: {
    id: 'woods',
    name: 'Woods',
    description: 'Dense deciduous and conifer forests, narrow dirt/gravel greenlanes, steep slopes',
    heightmap: {
      seed: '20',
      scale: 140,
      offset: 80,
      layerResolutions: [3, 15, 35],
      squared: false,
      depthHeightFactor: 1.15,
      temper: false,
      tileScaleRandom: 0.1
    },
    midline: {
      seed: 512,
      feelDist: 3.5,
      feelAng: 0.7,
      maxTurnDelta: 1.2,
      nodeSpacing: 10,
      panicDist: 8,
      testDist: 15,
      minElev: 2,
      maxGrad: 0.22,
      curvatureHeightFactor: 6,
      roadWidth: 6,
      curbWidth: 0.3,
      margin: 12,
      isGreenlane: true,
      isOffroad: true
    },
    textures: {
      road: 'textures/road_single_base.webp',
      grass: 'textures/grass.webp',
      cliff: 'textures/cliff.webp',
      wall: 'textures/wall_barrier_wood.webp'
    }
  },

  Coast: {
    id: 'coast',
    name: 'Coast',
    description: 'Ocean sea cliffs, coastal highways, sea walls, sandy beaches, and water surface',
    heightmap: {
      seed: '20',
      scale: 160,
      offset: 40,
      layerResolutions: [3, 25],
      squared: true,
      depthHeightFactor: 1.3,
      temper: true,
      temperBase: -10,
      temperBelow: 80,
      temperMin: 0.1
    },
    midline: {
      seed: 888,
      feelDist: 5,
      feelAng: 0.55,
      maxTurnDelta: 0.9,
      nodeSpacing: 10,
      panicDist: 10,
      testDist: 20,
      minElev: 8,
      maxGrad: 0.12,
      curvatureHeightFactor: 4.5,
      roadWidth: 9,
      curbWidth: 0.45,
      margin: 18
    },
    textures: {
      road: 'textures/road_base.webp',
      sand: 'textures/sand.webp',
      cliff: 'textures/cliff.webp',
      cliffBump: 'textures/cliff_bump.webp',
      sea: 'textures/sea_waves.webp',
      wall: 'textures/wall_concrete.webp'
    }
  }
};

export default BiomePresets;
