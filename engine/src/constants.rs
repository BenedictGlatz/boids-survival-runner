/// Default maximum speed for newly spawned boids (units per frame).
pub const DEFAULT_MAX_SPEED: f32 = 3.7;

/// Default maximum acceleration applied per frame.
pub const DEFAULT_MAX_ACCELERATION: f32 = 0.09;

/// Default radius within which a boid perceives its neighbours.
pub const DEFAULT_PERCEPTION_RADIUS: f32 = 70.0;

/// Default weight applied to the separation steering rule.
pub const DEFAULT_SEPARATION_WEIGHT: f32 = 3.2;

/// Default weight applied to the alignment steering rule.
pub const DEFAULT_ALIGNMENT_WEIGHT: f32 = 0.45;

/// Default weight applied to the cohesion steering rule.
pub const DEFAULT_COHESION_WEIGHT: f32 = 0.24;

/// Share of a boid's perception radius inside which a neighbour counts as *close*
/// and the separation rule starts pushing back. At the default perception radius
/// that is about 25 units.
///
/// **This is the flock's density dial, and the weight is not.** All four rules are
/// summed in `flocking_steering` and the result is then capped by
/// `max_acceleration` in `clamp_force`. At short range separation alone already
/// saturates that cap, so lowering `DEFAULT_SEPARATION_WEIGHT` barely moves the
/// resting distance between two boids — the force was going to be clamped either
/// way. This share decides *from where on* separation acts at all, which is what
/// actually sets that distance. Lower it and the swarm packs into a denser cloud.
pub const CLOSE_NEIGHBOUR_RADIUS_SHARE: f32 = 0.36;

/// Default weight applied to steering toward the player.
pub const DEFAULT_TARGET_SEEK_WEIGHT: f32 = 0.22;

/// Number of boids spawned when a new browser game starts.
pub const INITIAL_BOID_COUNT: u32 = 24;

/// Additional boids introduced for each new wave.
pub const WAVE_BOID_INCREMENT: u32 = 12;

/// Maximum difficulty tier used for boid variants and colours.
pub const MAX_BOID_DIFFICULTY_TIER: u32 = 4;

// ---------------------------------------------------------------------------
// Wave spawn gates
//
// Every wave after the first arrives through a handful of gates on the world edge,
// and each gate is announced before it opens. Two problems are solved by the same
// mechanism, which is why it replaced the old free placement rather than being added
// next to it:
//
//  - *Where.* A wave used to appear anywhere in the world that was far enough from
//    the player. "Far enough" is measured at the instant of spawning, so a player
//    already flying towards that spot met a boid that had materialised in front of
//    them. On the edge there is nothing for the player to be flying into: they are
//    inside the arena, and a boid coming in from the border always approaches from
//    somewhere the player can see it come.
//  - *When.* The gate is drawn for the length of the warning window below while
//    nothing is there yet, so the arrival is announced instead of happening.
//
// Durations count in simulation steps for the same reason the dash and obstacle ones
// do: tick() advances exactly one fixed step and never scales by delta time.
// ---------------------------------------------------------------------------

/// How long a gate is shown before its boids appear (2 seconds at 60 steps/second).
///
/// Deliberately longer than `OBSTACLE_ARMING_STEPS`: an obstacle is one thing to
/// steer around, a gate is a dozen boids to be somewhere else for.
pub const WAVE_SPAWN_WARNING_STEPS: u32 = 120;

/// How many places along the world edge one wave arrives from.
///
/// A single gate would let the player park on the far side of the arena and wait; one
/// gate per boid would be a ring of markers rather than a readable warning. Three
/// splits the wave into groups small enough to dodge and spread far enough apart that
/// no corner of the world is safe.
pub const WAVE_SPAWN_GATE_COUNT: u32 = 3;

/// How far along the edge the boids of one gate are spread out.
///
/// Wide enough that they do not all launch from one point, narrow enough that the
/// glow of the announcement still reads as a single gate.
pub const WAVE_SPAWN_GATE_SPREAD: f32 = 84.0;

/// How far inside the world edge a gate sits.
///
/// Not zero, so a boid is fully inside the arena on its first step and is drawn whole
/// rather than half over the border.
pub const WAVE_SPAWN_EDGE_INSET: f32 = 10.0;

/// Positions tried along the perimeter before a gate settles for the best it found.
///
/// A gate has to keep the safe spawn distance from the player, and a player standing
/// against a wall is exactly where that fails. Nudging the gate along the edge is what
/// resolves it; this is how many nudges are tried.
pub const WAVE_SPAWN_GATE_PLACEMENT_ATTEMPTS: u32 = 16;

/// How far the launch direction of a boid is bent sideways off the straight line into
/// the world.
///
/// Zero would send every boid of a gate along parallel tracks, which reads as a
/// formation rather than a swarm. Alternating the sign fans the group out over its
/// first second of flight.
pub const WAVE_SPAWN_LATERAL_SHARE: f32 = 0.35;

/// Radius used to keep boids from visually stacking on top of each other.
///
/// The relaxation holds twice this value between two boid centres, so 6 means a
/// minimum distance of 12 — roughly the length the frontend draws a boid at. Two
/// neighbours at rest therefore almost touch, which is what makes the swarm read as
/// one dense cloud rather than a field of separate darts.
pub const BOID_COLLISION_RADIUS: f32 = 6.0;

/// Number of pairwise passes used to relax overlapping boids each frame.
pub const BOID_OVERLAP_RELAXATION_STEPS: usize = 4;

/// Radius used for the player's own body when it is swept against an obstacle.
///
/// Deliberately *not* the radius a boid is tested against — that one is
/// `BOID_HIT_RADIUS`. This value carries the no-dead-end guarantee: the compile-time
/// assertion further down inflates every obstacle by it, so shrinking it would widen
/// the corridors the guarantee promises and let the player clip into surfaces.
pub const PLAYER_COLLISION_RADIUS: f32 = 14.0;

/// Distance at which a boid counts as having caught the player.
///
/// `aabb_overlap` compares against twice the radius, so this is a hit at 21 units
/// between the two centres: the player's drawn radius of 16 plus half a boid's drawn
/// length. Split off from `PLAYER_COLLISION_RADIUS` because that one is the obstacle
/// sweep and is pinned by the corridor assertion — one number could not shrink with
/// the boid without also loosening the dead-end guarantee.
pub const BOID_HIT_RADIUS: f32 = 10.5;

// ---------------------------------------------------------------------------
// Boid dash
//
// Every duration here is counted in simulation steps, never in milliseconds:
// the engine advances one fixed step per tick() and never scales by delta time.
// At 60 steps per second, 60 steps are one second.
// ---------------------------------------------------------------------------

/// Lowest difficulty tier that is allowed to dash at the player. Tier is one
/// below the wave number, so tier 2 means the dash appears in wave 3 and the
/// first two waves stay a plain swarm the player can learn against.
pub const DASH_UNLOCK_DIFFICULTY_TIER: u32 = 2;

/// Default length of the visible charge-up before a dash (~0.9 seconds). This is
/// the warning the player gets, so it is deliberately the longest phase.
pub const DEFAULT_DASH_CHARGE_STEPS: u32 = 54;

/// Charge-up steps removed for each difficulty tier, so later waves strike faster.
pub const DASH_CHARGE_STEPS_PER_TIER_REDUCTION: u32 = 5;

/// Shortest charge-up ever used. Below this the pulse would flash past before the
/// player could read which boid is about to lunge.
pub const MINIMUM_DASH_CHARGE_STEPS: u32 = 24;

/// Default length of the dash itself (~0.3 seconds).
pub const DEFAULT_DASH_STEPS: u32 = 18;

/// Extra dash steps granted per difficulty tier.
pub const DASH_STEPS_PER_TIER_BONUS: u32 = 1;

/// Default factor applied to a boid's maximum speed while it is dashing.
pub const DEFAULT_DASH_SPEED_MULTIPLIER: f32 = 2.6;

/// Extra dash speed factor per difficulty tier.
pub const DASH_SPEED_MULTIPLIER_PER_TIER_BONUS: f32 = 0.2;

/// Default steps a boid must wait after a dash before it may dash again (5 s).
pub const DEFAULT_DASH_COOLDOWN_STEPS: u32 = 300;

/// Cooldown steps removed per difficulty tier.
pub const DASH_COOLDOWN_STEPS_PER_TIER_REDUCTION: u32 = 30;

/// How often the flock offers a new dash, in simulation steps. Together with the
/// concurrency limit below this is what keeps the dashing part of the flock a
/// readable handful of boids instead of a wall of lunges.
pub const DASH_SELECTION_INTERVAL_STEPS: u32 = 24;

/// Boids allowed to charge or dash at the same time in a small flock. Has to hold
/// at least two full groups, or a single group would block every other lunge.
pub const MAX_CONCURRENT_DASHING_BOIDS: usize = 12;

/// One extra dash slot is unlocked for every this many boids in the flock, so a
/// dash still happens now and then once the swarm has grown large.
pub const BOIDS_PER_EXTRA_DASH_SLOT: usize = 40;

/// Most boids that may lunge together as one group. A group is what the player
/// reads as a coordinated push, so it stays small enough to still be dodgeable.
pub const MAX_DASH_GROUP_SIZE: usize = 6;

/// How close a boid has to be to the boid that was picked first to join its
/// group. Deliberately below `DEFAULT_PERCEPTION_RADIUS`, so a group is always a
/// cluster that already flies together rather than boids gathered from across
/// the screen. At the flock's packing density this still holds far more boids than
/// one group needs, so a group rarely fails to fill up.
pub const DASH_GROUP_RADIUS: f32 = 48.0;

/// A boid closer to the player than this leaves no room to dodge, so it is not
/// offered a dash.
pub const MINIMUM_DASH_SELECTION_DISTANCE: f32 = 160.0;

/// A boid further from the player than this would run out of dash before
/// arriving, so it is not offered one either.
pub const MAXIMUM_DASH_SELECTION_DISTANCE: f32 = 340.0;

// ---------------------------------------------------------------------------
// Temporary obstacles
//
// An obstacle is a capsule: a centre line of two points plus a radius. A circular
// obstacle is the capsule whose centre line has zero length, which is why there is
// no separate set of constants for the two shapes.
//
// Durations here count in simulation steps for the same reason as the dash ones:
// tick() advances exactly one fixed step and never scales by delta time.
// ---------------------------------------------------------------------------

/// How long an obstacle stays in the world (40 seconds at 60 steps per second).
pub const DEFAULT_OBSTACLE_LIFETIME_STEPS: u32 = 2400;

/// How long a new obstacle spends materialising before it can be collided with
/// (1.5 seconds at 60 steps per second).
///
/// **This is the fair-play window.** An obstacle is placed at a distance from the
/// player, but nothing stops the player from flying towards that spot, so an obstacle
/// that was solid the instant it appeared could take a life away for a move the player
/// had already committed to. For the length of this window it is drawn but inert: the
/// spawn animation the frontend runs off `obstacle_render_phase` is exactly this window,
/// which is what makes the warning honest rather than decorative.
///
/// Long enough to be seen and steered away from at full speed even at the lowest
/// supported frame rate, and short enough to stay a small share of the lifetime above —
/// an obstacle that stayed passable for long would be a shortcut rather than a warning.
pub const OBSTACLE_ARMING_STEPS: u32 = 90;

/// The narrowest gap ever left between two obstacles, and between an obstacle and
/// a world edge.
///
/// **This constant is what makes a dead end impossible.** Inflating every obstacle
/// by the player's radius turns it into a convex island the player cannot enter. As
/// long as this value stays above twice `PLAYER_COLLISION_RADIUS`, no two inflated
/// islands can touch and none can touch a wall, so every one of them can be walked
/// around and the free space stays in one piece. At roughly three player diameters
/// the remaining gap also reads as a lane rather than a slot.
pub const MINIMUM_CORRIDOR_WIDTH: f32 = 80.0;

// Checked at compile time rather than in a test, because the whole no-dead-end
// argument rests on this one inequality: a corridor narrower than the player would be
// a gap the guarantee promises but the player cannot use. A build that broke it should
// not produce a binary at all.
const _: () = assert!(MINIMUM_CORRIDOR_WIDTH > 2.0 * PLAYER_COLLISION_RADIUS);

/// Smallest radius an obstacle may be given.
///
/// Inflated by the player's radius the capsule has to stay wider than the furthest
/// the player can travel in one simulation step — a dash covers about 18 pixels —
/// or a fast enough player could pass clean through it between two steps.
pub const MINIMUM_OBSTACLE_RADIUS: f32 = 12.0;

/// How far outside an obstacle's inflated surface a blocked player is placed.
///
/// **This margin is what makes getting stuck impossible.** Placing the player exactly
/// on the surface leaves them at a distance the very next collision test reads as a
/// touch again — including on a move that leads *away* from the obstacle, because the
/// swept path still starts on the surface. The player was then corrected back onto it
/// every step and could not leave. Standing clear by a visible margin instead means an
/// outward move is never blocked, and the push doubles as the knockback a collision
/// should feel like. It has to stay well below `MINIMUM_CORRIDOR_WIDTH` so a player
/// pushed off one obstacle cannot be pushed into the next.
pub const PLAYER_OBSTACLE_KNOCKBACK_DISTANCE: f32 = 8.0;

/// How long an obstacle keeps glowing red after the player ran into it (~0.3 s).
///
/// Long enough to be seen at the lowest supported frame rate, short enough that a
/// player brushing along an obstacle sees separate flashes rather than one long one.
pub const OBSTACLE_HIT_FLASH_STEPS: u32 = 18;

/// Highest tier the obstacle density ramp reaches. Deliberately further than
/// `MAX_BOID_DIFFICULTY_TIER`: the boid variants are at their limit from wave five
/// on, while the obstacles are meant to keep getting denser well beyond that.
pub const MAX_OBSTACLE_DENSITY_TIER: u32 = 8;

/// Steps between two attempts to place a new obstacle, in the first wave.
pub const DEFAULT_OBSTACLE_SPAWN_INTERVAL_STEPS: u32 = 540;

/// Steps removed from the spawn interval per density tier.
pub const OBSTACLE_SPAWN_INTERVAL_STEPS_PER_TIER_REDUCTION: u32 = 45;

/// Shortest spawn interval ever used (~3 seconds).
pub const MINIMUM_OBSTACLE_SPAWN_INTERVAL_STEPS: u32 = 180;

/// Obstacles allowed in the world at the same time in the first wave.
pub const DEFAULT_MAX_CONCURRENT_OBSTACLES: usize = 4;

/// Additional simultaneous obstacles unlocked per density tier.
pub const MAX_CONCURRENT_OBSTACLES_PER_TIER_BONUS: usize = 1;

/// Hard ceiling on simultaneous obstacles, whatever the wave.
pub const MAXIMUM_CONCURRENT_OBSTACLES: usize = 12;

/// Placements tried per spawn round before the round is given up on.
///
/// The corridor rule is absolute and the density is only a target: if none of these
/// attempts finds a legal spot, no obstacle appears this round.
pub const OBSTACLE_SPAWN_ATTEMPTS: u64 = 12;

/// Every nth candidate is a circle; the rest are bars.
pub const OBSTACLE_CIRCLE_EVERY_NTH: u64 = 3;

/// Distinct orientations a bar-shaped obstacle can be given. Eight steps across a
/// half turn are easier to read in the code than a continuous angle and are
/// visually indistinguishable from one.
pub const OBSTACLE_ORIENTATION_COUNT: u64 = 8;

/// Smallest radius of a circular obstacle.
pub const MINIMUM_OBSTACLE_CIRCLE_RADIUS: f32 = 34.0;

/// Range of radii above the minimum a circular obstacle can take.
pub const OBSTACLE_CIRCLE_RADIUS_RANGE: f32 = 46.0;

/// Half the thickness of a bar-shaped obstacle.
pub const OBSTACLE_BAR_RADIUS: f32 = 13.0;

/// Shortest centre line a bar-shaped obstacle can have.
pub const MINIMUM_OBSTACLE_BAR_LENGTH: f32 = 120.0;

/// Range of lengths above the minimum a bar-shaped obstacle can take.
pub const OBSTACLE_BAR_LENGTH_RANGE: f32 = 200.0;

/// Default weight applied to the obstacle avoidance steering rule.
///
/// It has to outweigh seeking the player: a boid that values the chase higher than
/// the wall in front of it presses against that wall instead of going round.
pub const DEFAULT_OBSTACLE_AVOID_WEIGHT: f32 = 1.6;

/// Share of a boid's perception radius at which it starts avoiding an obstacle.
pub const OBSTACLE_LOOK_AHEAD_SHARE: f32 = 0.9;

/// How strongly the escape direction is bent along the obstacle surface rather
/// than straight away from it.
///
/// Zero would push a boid back the way it came, which stalls it in front of the
/// obstacle instead of taking it past. Above one the sideways pull dominates and
/// the boid sweeps around the surface, which is what reads as flying round it.
pub const OBSTACLE_TANGENT_SHARE: f32 = 1.25;
