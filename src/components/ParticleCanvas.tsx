import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GPUFluidSimulation } from '../lib/fluid';
import { AXONParticleSystem } from '../lib/particleSystem';

export const ParticleCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Detect software WebGL
    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    const isMobile = window.innerWidth <= 760;
    const dpr = isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio || 1, 2.0);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setClearColor(0x000000, 1.0);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);

    const fluid = new GPUFluidSimulation();
    const particles = new AXONParticleSystem({ isMobile, dpr });
    particles.initTargets(renderer);

    let animationFrameId: number;
    let timerId: number;
    let isDisposed = false;
    let lastTime = performance.now();

    const handlePointer = (clientX: number, clientY: number) => {
      particles.updateGaze(clientX, clientY, window.innerWidth, window.innerHeight);
      fluid.addPointerMove(
        clientX,
        clientY,
        window.innerWidth,
        window.innerHeight,
        renderer,
        isMobile
      );
    };

    const onPointerMove = (e: MouseEvent) => {
      handlePointer(e.clientX, e.clientY);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointer(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', onPointerMove, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });

    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const currentDpr = isSoftwareGl ? 1.0 : Math.min(window.devicePixelRatio || 1, 2.0);
      renderer.setPixelRatio(currentDpr);
      renderer.setSize(w, h);
      particles.resize(w, h, currentDpr);
    };

    window.addEventListener('resize', onResize);

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (isDisposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          timerId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          timerId = window.setTimeout(cb, 60);
        }
      };
      timerId = window.setTimeout(poll, 5);
    }

    const render = (now: number) => {
      if (isDisposed) return;

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const timeInSec = now * 0.001;

      // 1. Advance fluid simulation
      fluid.step(renderer);

      // 2. Advance particle simulation with fluid textures
      particles.step(
        renderer,
        timeInSec,
        dt || 1 / 60,
        fluid.velocityTexture,
        fluid.densityTexture
      );

      // 3. Render 3D scene to canvas
      renderer.setRenderTarget(null);
      renderer.render(particles.scene, particles.camera);

      if (isSoftwareGl) {
        afterDraw(() => {
          if (!isDisposed) {
            animationFrameId = requestAnimationFrame(render);
          }
        });
      } else {
        animationFrameId = requestAnimationFrame(render);
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timerId);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('resize', onResize);
      particles.dispose();
      fluid.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      id="bg"
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
