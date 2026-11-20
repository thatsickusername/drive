import { PiecewiseCurve } from './PiecewiseCurve';

export enum SportType {
  Snowboard = 'Snowboard',
  Skis = 'Skis'
}

export enum TurnType {
  None = 'None',
  StandardTurn = 'StandardTurn',
  SharpTurn = 'SharpTurn',
  SlideTurn = 'SlideTurn',
  OverTurn = 'OverTurn'
}

export enum MovementState {
  Standing = 'Standing',
  Skiing = 'Skiing',
  Airborne = 'Airborne',
  Railing = 'Railing',
  WaterSkiing = 'WaterSkiing',
  Crashing = 'Crashing'
}

export interface PlayerConfig {
  deltatime: number; // 0.003s = 333.3 Hz
  radius: number;
  frame_interpolation: number;

  maxStandingVelocity: number;
  skiingToStandingVelocity: number;
  standingToSkiingPushVelocity: number;
  standingToSkiingVelocity: number;

  jump_strength: number; // 4.0 m/s
  trick_hover_zforce: number; // 0.5 m/s^2
  air_friction: number; // 0.006 per tick
  air_bend_down_rad: number;

  ground_friction_base: number; // 1.0
  ground_friction_switch_no_twintips: number; // 10.0
  ground_friction_switch_twintips_hard_collision: number;
  ground_pull_force: number; // 5.0

  speedboost_npc_slapped: number;
  speedboost_trick_points: number[];
  speedboost_trick_boosts: number[];
  speedboost_drift_durations: number[];
  speedboost_drift_boosts: number[];
  speedboost_steep_slope: number;
  speedboost_rocket_jump_dir: number;
  speedboost_rocket_jump_vertical: number;

  rotationboost_from_th: number;
  rotationboost_to_th: number;
  rotationboost_sharp_turn_from_th: number;
  rotationboost_sharp_turn_to_th: number;
  rotationboost_sharp_turn_boost: number;

  spin_acceleration: number; // 10.0 rad/s^2
  spin_deceleration: number; // 15.0 rad/s^2
  flip_acceleration: number; // 8.0 rad/s^2
  flip_deceleration: number; // 8.0 rad/s^2
  roll_acceleration: number; // 8.0 rad/s^2
  roll_deceleration: number; // 8.0 rad/s^2
  cork_max_offset: number;
  cork_speed: number;
  tailnosepress_rotation: number;
  turn_around_speed: number;

  staking_inclination_regular_from_deg: number;
  staking_inclination_regular_to_deg: number;
  staking_inclination_damped_from_deg: number;
  staking_inclination_damped_to_deg: number;
  staking_max_vel: number;
  staking_power: number;
  staking_initial_power: number;
  staking_damped_mul: number;

  breaking_power: number; // 2.5
  slap_radius: number; // 3.0
  slap_recoil: number; // 3.0
  tackle_min_velocity: number; // 10.0

  slideturn_boost_timepoint: number; // 0.5s
  slideturn_boost_velocity: number; // 2.0 m/s

  turn_cap_deg_standard: number;
  drift_penalty_standard: number;
  drift_velocity_standard: PiecewiseCurve;
  turn_velocity_standard: PiecewiseCurve;
  turn_turntime_standard: PiecewiseCurve;

  duration_sharpturn: number;
  turn_cap_deg_sharpturn: number;
  drift_penalty_sharpturn: number;
  drift_velocity_sharpturn: PiecewiseCurve;
  drift_turntime_sharpturn: PiecewiseCurve;
  turn_velocity_sharpturn: PiecewiseCurve;

  turn_cap_deg_slideturn: number;
  drift_penalty_slideturn: number;
  drift_velocity_slideturn: PiecewiseCurve;
  drift_turntime_slideturn: PiecewiseCurve;
  turn_velocity_slideturn: PiecewiseCurve;
  turn_turntime_slideturn: PiecewiseCurve;

  turn_cap_deg_overturn_no_twintip: number;
  turn_cap_deg_overturn: number;
  drift_penalty_overturn: number;
  drift_velocity_overturn: PiecewiseCurve;
  turn_velocity_overturn: PiecewiseCurve;

  crash_magnitude_ground: number;
  penalty_magnitude_ground: number;
  velocity_penalty_ground: number;
  crash_magnitude_object: number;
  max_turn_angle_deg: number;
  backward_max_velocity: number;
  backward_friction: number;
  time_on_rough_ground_before_crash: number;

  // Inclination dampening filters
  inclination_dampening_extra: number;
  inclination_dampening_regular: number;
  inclination_dampening_max_regular: number;
  inclination_dampening_min_regular: number;

  // Snowslide edge carving propulsion (snowboards)
  snowslide_push_mul: number;

  // Snowdepth spring suspension model
  snowdepth_spring_constant: number;
  snowdepth_spring_pull: number;
  snowdepth_vel_damp: number;
  snowdepth_pos_damp: number;
  snowdepth_pos_addition: number;
  snowdepth_vel_transfer: number;
}

export function createDefaultPlayerConfig(): PlayerConfig {
  return {
    deltatime: 0.003,
    radius: 0.3,
    frame_interpolation: 10,

    maxStandingVelocity: 1.0,
    skiingToStandingVelocity: 3.0,
    standingToSkiingPushVelocity: 3.0,
    standingToSkiingVelocity: 1.0,

    jump_strength: 4.0,
    trick_hover_zforce: 0.5,
    air_friction: 0.006,
    air_bend_down_rad: 0.24,

    ground_friction_base: 1.0,
    ground_friction_switch_no_twintips: 10.0,
    ground_friction_switch_twintips_hard_collision: 100.0,
    ground_pull_force: 5.0,

    speedboost_npc_slapped: 2.0,
    speedboost_trick_points: [800.0, 1600.0, 3000.0],
    speedboost_trick_boosts: [1.7, 3.2, 6.0],
    speedboost_drift_durations: [0.7, 1.4, 2.1],
    speedboost_drift_boosts: [0.5, 1.2, 1.8],
    speedboost_steep_slope: 2.0,
    speedboost_rocket_jump_dir: 2.0,
    speedboost_rocket_jump_vertical: 3.0,

    rotationboost_from_th: 0.1,
    rotationboost_to_th: 0.2,
    rotationboost_sharp_turn_from_th: 0.3,
    rotationboost_sharp_turn_to_th: 0.8,
    rotationboost_sharp_turn_boost: 2.0,

    spin_acceleration: 10.0,
    spin_deceleration: 15.0,
    flip_acceleration: 8.0,
    flip_deceleration: 8.0,
    roll_acceleration: 8.0,
    roll_deceleration: 8.0,
    cork_max_offset: 1.0,
    cork_speed: 2.0,
    tailnosepress_rotation: 2.0,
    turn_around_speed: 800.0,

    staking_inclination_regular_from_deg: -20.0,
    staking_inclination_regular_to_deg: 0.0,
    staking_inclination_damped_from_deg: 0.0,
    staking_inclination_damped_to_deg: 20.0,
    staking_max_vel: 0.7,
    staking_power: 15.0,
    staking_initial_power: 5.0,
    staking_damped_mul: 0.2,

    breaking_power: 2.5,
    slap_radius: 3.0,
    slap_recoil: 3.0,
    tackle_min_velocity: 10.0,

    slideturn_boost_timepoint: 0.5,
    slideturn_boost_velocity: 2.0,

    turn_cap_deg_standard: 30.0,
    drift_penalty_standard: 1.0,
    drift_velocity_standard: new PiecewiseCurve([0.0, 0.2, 1.0], [0.018, 0.006, 0.006]),
    turn_velocity_standard: new PiecewiseCurve([0.0, 0.4, 1.0], [5.0, 1.8, 1.2]),
    turn_turntime_standard: new PiecewiseCurve([0.0, 0.3, 1.0], [0.0, 0.0, 1.0]),

    duration_sharpturn: 0.3,
    turn_cap_deg_sharpturn: 50.0,
    drift_penalty_sharpturn: 1.0,
    drift_velocity_sharpturn: new PiecewiseCurve([0.0, 0.3, 1.0], [0.001, 0.005, 0.007]),
    drift_turntime_sharpturn: new PiecewiseCurve([0.0, 0.99, 1.0], [0.0, 0.0, 0.001]),
    turn_velocity_sharpturn: new PiecewiseCurve([0.0, 0.3, 1.0], [10.0, 10.0, 4.0]),

    turn_cap_deg_slideturn: 30.0,
    drift_penalty_slideturn: 0.0,
    drift_velocity_slideturn: new PiecewiseCurve([0.0, 0.99, 1.0], [0.001, 0.001, 0.001]),
    drift_turntime_slideturn: new PiecewiseCurve([0.0, 0.7, 1.0], [0.0, 0.0005, 0.001]),
    turn_velocity_slideturn: new PiecewiseCurve([0.0, 0.4, 1.0], [5.0, 5.0, 5.0]),
    turn_turntime_slideturn: new PiecewiseCurve([0.0, 0.3, 1.0], [0.0, 0.0, 1.0]),

    turn_cap_deg_overturn_no_twintip: 30.0,
    turn_cap_deg_overturn: 60.0,
    drift_penalty_overturn: 10.0,
    drift_velocity_overturn: new PiecewiseCurve([0.0, 0.2, 1.0], [0.003, 0.003, 0.003]),
    turn_velocity_overturn: new PiecewiseCurve([0.0, 0.5, 1.0], [4.0, 4.0, 4.0]),

    crash_magnitude_ground: 26.0,
    penalty_magnitude_ground: 21.0,
    velocity_penalty_ground: 0.3,
    crash_magnitude_object: 40.0,
    max_turn_angle_deg: 120.0,
    backward_max_velocity: 12.0,
    backward_friction: 15.0,
    time_on_rough_ground_before_crash: 3.0,

    inclination_dampening_extra: 10000000,
    inclination_dampening_regular: 50000,
    inclination_dampening_max_regular: 0.2,
    inclination_dampening_min_regular: 0.03,

    snowslide_push_mul: 3.0,

    snowdepth_spring_constant: 20.0,
    snowdepth_spring_pull: 1.0,
    snowdepth_vel_damp: 0.99,
    snowdepth_pos_damp: 0.95,
    snowdepth_pos_addition: 1.0,
    snowdepth_vel_transfer: 10.0
  };
}
