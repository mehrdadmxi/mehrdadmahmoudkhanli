/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ParticleCanvas } from './components/ParticleCanvas';
import { UIOverlay } from './components/UIOverlay';
import { GeminiChatbot } from './components/GeminiChatbot';

export default function App() {
  return (
    <main className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Layer 1: WebGL Particle Cloud and Fluid Canvas */}
      <ParticleCanvas />

      {/* Layer 2: Persian UI Overlay */}
      <UIOverlay />

      {/* Layer 3: Interactive Gemini AI Chatbot */}
      <GeminiChatbot />
    </main>
  );
}
