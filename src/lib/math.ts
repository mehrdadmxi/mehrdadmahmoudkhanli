/**
 * Math utilities for AXON GPGPU particle simulation and SDF calculation.
 */

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export function rotateByQuat(p: Vec3, q: { x: number; y: number; z: number; w: number }): Vec3 {
  // q = (0.5, 0.5, 0.5, 0.5)
  // v' = p + 2.0 * cross(q.xyz, cross(q.xyz, p) + q.w * p)
  const qv = { x: q.x, y: q.y, z: q.z };
  const cross1 = {
    x: qv.y * p.z - qv.z * p.y + q.w * p.x,
    y: qv.z * p.x - qv.x * p.z + q.w * p.y,
    z: qv.x * p.y - qv.y * p.x + q.w * p.z,
  };
  const cross2 = {
    x: qv.y * cross1.z - qv.z * cross1.y,
    y: qv.z * cross1.x - qv.x * cross1.z,
    z: qv.x * cross1.y - qv.y * cross1.x,
  };
  return {
    x: p.x + 2.0 * cross2.x,
    y: p.y + 2.0 * cross2.y,
    z: p.z + 2.0 * cross2.z,
  };
}

export function mirrorDepth(z: number): number {
  return Math.sqrt(z * z + 0.0215) - Math.sqrt(0.012);
}

/**
 * Evaluates the signed distance function for the AXON sculpted logo form.
 * Closed, smooth, twisted ring with a large hollow opening and softer lobes.
 */
export function evaluateSDF(pInput: Vec3): number {
  const len = Math.sqrt(pInput.x * pInput.x + pInput.y * pInput.y + pInput.z * pInput.z);
  if (len > 0.8) {
    return len - 0.7;
  }

  // 1. Mirror depth axis
  const mirroredZ = mirrorDepth(pInput.z);
  const pMirrored: Vec3 = { x: pInput.x, y: pInput.y, z: mirroredZ };

  // 2. Rotate by quaternion (0.5, 0.5, 0.5, 0.5)
  const q = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
  const p = rotateByQuat(pMirrored, q);

  // 3. Torus / bent ring core with harmonic sine modulation
  const rMajor = 0.38;
  const rMinor = 0.16;
  const dPlane = Math.sqrt(p.x * p.x + p.y * p.y) - rMajor;
  let d = Math.sqrt(dPlane * dPlane + p.z * p.z) - rMinor;

  // Sine network harmonics for lobes and twisting
  const angle = Math.atan2(p.y, p.x);
  const harmonic = 0.06 * Math.sin(angle * 2.0 + p.z * 5.0) + 0.03 * Math.cos(p.x * 6.0);
  d += harmonic;

  return d;
}

/**
 * Calculates central difference normal for the SDF.
 */
export function calculateSDFNormal(p: Vec3, eps = 0.001): Vec3 {
  const dx = evaluateSDF({ x: p.x + eps, y: p.y, z: p.z }) - evaluateSDF({ x: p.x - eps, y: p.y, z: p.z });
  const dy = evaluateSDF({ x: p.x, y: p.y + eps, z: p.z }) - evaluateSDF({ x: p.x, y: p.y - eps, z: p.z });
  const dz = evaluateSDF({ x: p.x, y: p.y, z: p.z + eps }) - evaluateSDF({ x: p.x, y: p.y, z: p.z - eps });
  const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1.0;
  return { x: dx / len, y: dy / len, z: dz / len };
}

/**
 * Computes fluid splat parameters based on mouse velocity.
 */
export function calculateMouseSplat(
  dx: number,
  dy: number,
  isMobile: boolean
): { len: number; radius: number; forceMult: number } {
  const len = Math.sqrt(dx * dx + dy * dy);
  // clamp-map(len, 0..5 -> 0..60) * 0.6 (* 0.8 on mobile)
  const mappedRadius = Math.min(Math.max((len / 5.0) * 60.0, 0), 60.0);
  const radius = mappedRadius * (isMobile ? 0.8 : 0.6);
  // force multiplier = clamp-map(len, 0..15 -> 0..10)
  const forceMult = Math.min(Math.max((len / 15.0) * 10.0, 0), 10.0);
  return { len, radius, forceMult };
}
