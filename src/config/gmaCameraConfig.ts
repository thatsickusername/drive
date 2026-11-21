/**
 * Grand Mountain Adventure (GMA) Camera Configuration
 * 1:1 decrypted parameters from mechanics/config/camera.yaml
 */
export const GMACameraConfig = {
  // Base & FOV
  baseFov: 60.0,
  nearFar: [0.2, 1200.0] as [number, number],
  playerScreenY: 0.15,
  offsetDistMul: 0.999,
  
  // Angle limits (in degrees)
  degreeRange: [38.0, 80.0] as [number, number],
  degreeRangeHotseat: [34.0, 50.0] as [number, number],

  // Topdown tracking factors
  topdownFocusPlayerPosT: 0.99,
  topdownOffsetT: 0.60,
  borderDistance: 80.0,
  rotSpeedMul: 2.0,
  rotOffset: 0.0,
  freezeFadeTime: 5.0,
  portraitDistanceMul: 1.5,
  portraitOffsetMul: 1.5,
  screenRatioZoom: [0.45, 0.55, 0.95, 1.0] as [number, number, number, number],

  // Terrain inclination compensation
  inclination: {
    offset: 0.01,
    min: -0.2,
    max: 0.4,
    windowSize: 10,
    smoothener: 0.03,
  },

  // Airborne / Flying dynamics
  flying: {
    fadeTime: 2.0,
    offsetDistMul: -0.15,
    cameraDistMul: -0.30,
  },

  // Touchdown landing impact shake
  shake: {
    k: 0.9,
    start: 0.4,
    speed: 8.0,
    power: 0.7,
  },

  // From Behind test camera mode
  behind: {
    addPhi: -25.0,
    addTheta: 180.0,
    playerT: 0.65,
    dist: 55.0,
    fixed: true,
    fixedPhi: 35.0,
    fixedDistance: 50.0,
  },
} as const;

export interface CameraSettings {
  mode: 'BEHIND' | 'TOPDOWN';
  fov: number;
  // Chase Camera (Behind)
  behindDistance: number;      // Zoom (meters from rider)
  behindPitch: number;         // Resting angle (degrees)
  behindMinPitch: number;      // Lower angle limit (degrees)
  behindMaxPitch: number;      // Upper angle limit (degrees)
  behindLookAheadDist: number; // Forward look-ahead distance (meters)
  behindLookAheadHeight: number; // Look-ahead target height (meters)
  behindFollowSpeed: number;   // Smooth rotation follow speed
  // GMA Isometric Top-Down
  topdownDistance: number;     // Top-down distance (meters)
  topdownPitch: number;        // Top-down pitch angle (degrees)
  // Control Sensitivity
  mouseSensitivity: number;
}

export const defaultCameraSettings: CameraSettings = {
  mode: 'BEHIND',              // Default behind chase camera
  fov: 60.0,
  behindDistance: 12.5,        // User custom zoom distance
  behindPitch: 22.0,           // Lower resting angle (deg)
  behindMinPitch: 8.0,         // Lower angle limit
  behindMaxPitch: 28.0,        // Strict upper pitch cap (deg)
  behindLookAheadDist: 4.5,    // User custom look-ahead lead (m)
  behindLookAheadHeight: 1.4,  // Look-ahead target height (m)
  behindFollowSpeed: 2.5,      // User custom heading smoothing speed
  topdownDistance: 38.0,       // User custom topdown zoom (m)
  topdownPitch: 48.0,          // User custom topdown pitch (deg)
  mouseSensitivity: 1.0,
};
