export interface VisualComponentConfig {
  name: string;
  type: 'box' | 'cylinder';
  dimensions: number[]; // [w, h, d] for box; [radiusTop, radiusBottom, height, radialSegments] for cylinder
  position: [number, number, number];
  rotation?: [number, number, number]; // Euler angles in radians
  material: 'body' | 'trim' | 'headlight' | 'taillight';
}

export interface VehicleVisualConfig {
  type: 'procedural' | 'gltf';
  gltfPath?: string;
  gltfScale?: [number, number, number];
  gltfOffset?: [number, number, number];
  components: VisualComponentConfig[];
}

export interface WheelConfigDef {
  mountPoint: [number, number, number];
  radius: number;
  width: number;
  suspensionRestLength: number;
  suspensionMaxTravel: number;
  springStiffness: number;
  dampingRate: number;
  isFront: boolean;
  isLeft: boolean;
}

export interface ChassisConfig {
  colliderHalfExtents: [number, number, number];
  colliderOffset: [number, number, number];
  density: number;
  friction: number;
  restitution: number;
  additionalMass: number;
  comOffset: [number, number, number];
  inertia: [number, number, number];
  linearDamping: number;
  angularDamping: number;
}

export interface EngineConfig {
  idleRpm: number;
  redlineRpm: number;
  maxRpm: number;
  peakTorque: number;
  peakTorqueRpm: number;
  revSpeed: number;
}

export interface ShiftPointsConfig {
  gear1UpshiftRpmBase: number;
  gear1UpshiftRpmThrottle: number;
  gear2UpshiftRpmBase: number;
  gear2UpshiftRpmThrottle: number;
  gear3UpshiftRpmBase: number;
  gear3UpshiftRpmThrottle: number;
  lowRangeUpshiftSpeed: number;
  lowRangeUpshiftRpm: number;
}

export interface TransmissionConfig {
  gearRatios: number[];
  reverseRatio: number;
  finalDriveRatio: number;
  highTransferRatio: number;
  lowTransferRatio: number;
  maxGears4L: number;
  shiftCooldown: number;
  shiftPoints: ShiftPointsConfig;
}

export interface DrivetrainConfig {
  wheelInertia: number;
  brakeTorque: number;
  handbrakeTorque: number;
  rollingDrag: number;
  aeroDragCoeff: number;
  maxSpeed4H: number;
  maxSpeed4L: number;
  maxWheelOmega4H: number;
  maxWheelOmega4L: number;
}

export interface VehicleDefinition {
  id: string;
  name: string;
  description: string;
  defaultColorHex: number;
  chassis: ChassisConfig;
  engine: EngineConfig;
  transmission: TransmissionConfig;
  drivetrain: DrivetrainConfig;
  wheels: WheelConfigDef[];
  visual: VehicleVisualConfig;
}
