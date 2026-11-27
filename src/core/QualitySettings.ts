export type QualityTier = 'low' | 'medium' | 'high';

export interface QualityPreset {
  tier: QualityTier;
  shadowMapSize: number;
  softShadows: boolean;
  dprCap: number;
  detailTexSize: number;
  detailAnisotropy: number;
  fillLightEnabled: boolean;
  backdropBlur: boolean;
  antialias: boolean;
}

export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  low: {
    tier: 'low',
    shadowMapSize: 1024,
    softShadows: false,
    dprCap: 1.0,
    detailTexSize: 512,
    detailAnisotropy: 1,
    fillLightEnabled: false,
    backdropBlur: false,
    antialias: false
  },
  medium: {
    tier: 'medium',
    shadowMapSize: 1024,
    softShadows: true,
    dprCap: 1.5,
    detailTexSize: 512,
    detailAnisotropy: 2,
    fillLightEnabled: true,
    backdropBlur: true,
    antialias: true
  },
  high: {
    tier: 'high',
    shadowMapSize: 2048,
    softShadows: true,
    dprCap: 2.0,
    detailTexSize: 1024,
    detailAnisotropy: 4,
    fillLightEnabled: true,
    backdropBlur: true,
    antialias: true
  }
};

const STORAGE_KEY = 'alpine_freeride_quality_tier';

function isValidTier(value: string | null): value is QualityTier {
  return value === 'low' || value === 'medium' || value === 'high';
}

export function detectDefaultQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'high';
  const params = new URLSearchParams(window.location.search);
  const queryTier = params.get('quality')?.toLowerCase() ?? null;
  if (isValidTier(queryTier)) {
    return queryTier;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isValidTier(saved)) return saved;
  } catch {
    // Ignore storage access errors in private browsing
  }

  const isCoarse = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  const lowCores = typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
  const smallViewport = window.innerWidth <= 900;
  if (isCoarse && (lowCores || smallViewport)) return 'low';
  if (isCoarse || lowCores) return 'medium';
  return 'high';
}

export function saveQualityTier(tier: QualityTier): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, tier);
  } catch {
    // Ignore storage access errors
  }
}

export function getQualityPreset(tier: QualityTier): QualityPreset {
  return QUALITY_PRESETS[tier];
}
