import * as THREE from 'three';

/**
 * Generates a 64x64 soft grey spherical matcap texture.
 * Soft diffuse shading with top-right illumination and subtle rim darkening.
 */
export function createMatcapTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const imgData = ctx.createImageData(size, size);
    const data = imgData.data;

    // Light direction (top-right, slightly front)
    const lx = 0.35;
    const ly = -0.45;
    const lz = 0.82;
    const lLen = Math.sqrt(lx * lx + ly * ly + lz * lz);
    const nlx = lx / lLen;
    const nly = ly / lLen;
    const nlz = lz / lLen;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Map [0, size-1] to [-1, 1]
        const nx = (x / (size - 1)) * 2 - 1;
        const ny = (y / (size - 1)) * 2 - 1;
        const r2 = nx * nx + ny * ny;

        const idx = (y * size + x) * 4;

        if (r2 <= 1.0) {
          const nz = Math.sqrt(1.0 - r2);
          // Lambert diffuse
          const diff = Math.max(0.0, nx * nlx + ny * nly + nz * nlz);
          // Ambient + soft rim falloff
          const ambient = 0.22;
          const rim = Math.pow(1.0 - nz, 2.5) * 0.15;
          const shade = Math.min(1.0, ambient + diff * 0.65 + rim);

          const val = Math.floor(shade * 255);
          data[idx] = val; // R
          data[idx + 1] = val; // G
          data[idx + 2] = val; // B
          data[idx + 3] = 255; // A
        } else {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}
