"use client";

import React, { useEffect, useRef, useState } from 'react';
import ControlsPanel from '../components/ControlsPanel';
import { useWebGL } from '../hooks/useWebGL';

const easeInOut = (t: number) => {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
};

const WebGLGradient = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [offsetProgress, setOffsetProgress] = useState(0);

  // Smooth interpolation factor (lower = smoother)
  const mouseSmoothingFactor = 0.1;
  
  // Use refs for smooth mouse interpolation to avoid infinite re-renders
  const currentMouseRef = useRef({ x: 0.5, y: 0.5 });
  const targetMouseRef = useRef({ x: 0.5, y: 0.5 });
  
  // Control states
  const [darkColor, setDarkColor] = useState({ r: 0.1, g: 0.1, b: 0.2 });
  const [lightColor, setLightColor] = useState({ r: 0.86, g: 0.84, b: 0.94 });
  const [middleColor, setMiddleColor] = useState({ r: 0.26, g: 0.58, b: 0.87 });
  const [warpValue, setWarpValue] = useState(1.8);
  const [borderRadius, setBorderRadius] = useState(128.0);
  const [borderThickness, setBorderThickness] = useState(48.0);
  const [gradientWidth, setGradientWidth] = useState(1.0);
  const [gradientAngle, setGradientAngle] = useState(90.0);
  
  // Noise effect controls
  const [noiseIntensity, setNoiseIntensity] = useState(0.05);
  const [noiseScale, setNoiseScale] = useState(1000.0);
  
  // Gradient repeating control
  const [gradientRepeating, setGradientRepeating] = useState(false);

  // Animation effect for smooth offset transitions
  useEffect(() => {
    const targetProgress = isMousePressed ? 1 : 0;
    const duration = 200; // 200ms
    const startTime = performance.now();
    const startProgress = offsetProgress;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeInOut(progress);
      const newProgress = startProgress + (targetProgress - startProgress) * easedProgress;
      
      setOffsetProgress(newProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isMousePressed]);

  // Use WebGL hook
  useWebGL({
    canvasRef,
    offsetProgress,
    darkColor,
    lightColor,
    middleColor,
    warpValue,
    borderRadius,
    borderThickness,
    gradientWidth,
    gradientAngle,
    gradientRepeating,
    noiseIntensity,
    noiseScale,
    currentMouseRef,
    targetMouseRef,
    mouseSmoothingFactor,
  });

  // Mouse event handlers
  const handleMouseMove = (event: MouseEvent) => {
    const x = (event.clientX / window.innerWidth) * 2 - 1;
    const y = (event.clientY / window.innerHeight) * 2 - 1;
    targetMouseRef.current = { x, y };
  };

  const handleMouseDown = () => {
    setIsMousePressed(true);
  };

  const handleMouseUp = () => {
    setIsMousePressed(false);
  };

  // Add event listeners for mouse tracking
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Add event listeners to window for global mouse tracking
    window.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-full max-w-2xl h-64 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-200 active:scale-95 shadow-2xl shadow-[#a1b8d1]/10 hover:shadow-[#569ce8]/20 active:shadow-[#569ce8]/40 relative" style={{ borderRadius: `${borderRadius}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black z-100 select-none w-full text-center pointer-events-none" style={{ mixBlendMode: 'difference', color: 'white' }}>Hello world!</p>
      </div>
      
      <ControlsPanel
        darkColor={darkColor}
        setDarkColor={setDarkColor}
        middleColor={middleColor}
        setMiddleColor={setMiddleColor}
        lightColor={lightColor}
        setLightColor={setLightColor}
        gradientAngle={gradientAngle}
        setGradientAngle={setGradientAngle}
        gradientRepeating={gradientRepeating}
        setGradientRepeating={setGradientRepeating}
        warpValue={warpValue}
        setWarpValue={setWarpValue}
        borderRadius={borderRadius}
        setBorderRadius={setBorderRadius}
        borderThickness={borderThickness}
        setBorderThickness={setBorderThickness}
        gradientWidth={gradientWidth}
        setGradientWidth={setGradientWidth}
        noiseIntensity={noiseIntensity}
        setNoiseIntensity={setNoiseIntensity}
        noiseScale={noiseScale}
        setNoiseScale={setNoiseScale}
      />
    </div>
  );
};

export default WebGLGradient;