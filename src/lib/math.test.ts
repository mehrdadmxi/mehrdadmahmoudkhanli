import test from 'node:test';
import assert from 'node:assert/strict';
import { rotateByQuat, mirrorDepth, evaluateSDF, calculateSDFNormal, calculateMouseSplat } from './math';

test('rotateByQuat rotates vector using unit quaternion', () => {
  const p = { x: 1, y: 0, z: 0 };
  const q = { x: 0.5, y: 0.5, z: 0.5, w: 0.5 };
  const rotated = rotateByQuat(p, q);
  const len = Math.sqrt(rotated.x * rotated.x + rotated.y * rotated.y + rotated.z * rotated.z);
  // Rotation preserves length
  assert.ok(Math.abs(len - 1.0) < 1e-5);
  // (0.5, 0.5, 0.5, 0.5) is a 120-degree rotation around (1,1,1)
  // maps x -> y, y -> z, z -> x
  assert.ok(Math.abs(rotated.x - 0) < 1e-4);
  assert.ok(Math.abs(rotated.y - 1) < 1e-4);
  assert.ok(Math.abs(rotated.z - 0) < 1e-4);
});

test('mirrorDepth is symmetric and smooth around z=0', () => {
  const z0 = mirrorDepth(0);
  assert.ok(z0 > 0);
  const zp = mirrorDepth(0.3);
  const zn = mirrorDepth(-0.3);
  assert.equal(zp, zn);
});

test('evaluateSDF returns bounding distance outside 0.8', () => {
  const far = { x: 1.0, y: 1.0, z: 1.0 };
  const len = Math.sqrt(3);
  const sdf = evaluateSDF(far);
  assert.ok(Math.abs(sdf - (len - 0.7)) < 1e-5);
});

test('calculateSDFNormal returns normalized unit vector', () => {
  const normal = calculateSDFNormal({ x: 0.38, y: 0.0, z: 0.1 });
  const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y + normal.z * normal.z);
  assert.ok(Math.abs(len - 1.0) < 1e-4);
});

test('calculateMouseSplat clamps and calculates radius & force multiplier', () => {
  const zeroSplat = calculateMouseSplat(0, 0, false);
  assert.equal(zeroSplat.len, 0);
  assert.equal(zeroSplat.radius, 0);
  assert.equal(zeroSplat.forceMult, 0);

  const activeSplat = calculateMouseSplat(3, 4, false); // len = 5
  assert.equal(activeSplat.len, 5);
  assert.equal(activeSplat.radius, 36); // (5/5)*60 * 0.6 = 36
  assert.ok(Math.abs(activeSplat.forceMult - (5 / 15) * 10) < 1e-4);

  const clampedSplat = calculateMouseSplat(100, 0, true);
  assert.equal(clampedSplat.radius, 60 * 0.8); // 48 on mobile
  assert.equal(clampedSplat.forceMult, 10);
});
