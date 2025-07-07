"use client";

import React, { useEffect, useRef, useState } from 'react';

const WebGLGradient = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [isMousePressed, setIsMousePressed] = useState(false);
  const [offsetProgress, setOffsetProgress] = useState(0);
  
  // Control states
  const [darkColor, setDarkColor] = useState({ r: 0.1, g: 0.1, b: 0.2 });
  const [lightColor, setLightColor] = useState({ r: 0.86, g: 0.84, b: 0.94 });
  const [middleColor, setMiddleColor] = useState({ r: 0.26, g: 0.58, b: 0.87 });
  const [warpValue, setWarpValue] = useState(-4.0);
  const [borderRadius, setBorderRadius] = useState(48.0);
  const [borderThickness, setBorderThickness] = useState(24.0);
  const [gradientWidth, setGradientWidth] = useState(0.5);
  const [gradientAngle, setGradientAngle] = useState(90.0);

  // Helper function to convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  // Easing function for smooth transitions
  const easeInOut = (t: number) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  };

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

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      console.error('Canvas not found');
      return;
    }

    const gl = canvas.getContext('webgl');

    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    // Vertex shader source
    const vertexShaderSource = /* glsl */`
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader source - creates white to black to white gradient with mouse offset and inner border
    const fragmentShaderSource = /* glsl */`
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_mouse;
      uniform vec2 u_resolution;
      uniform vec3 u_darkColor;
      uniform vec3 u_lightColor;
      uniform vec3 u_middleColor;
      uniform float u_warpValue;
      uniform float u_borderRadius;
      uniform float u_borderThickness;
      uniform float u_gradientWidth;
      uniform float u_gradientAngle;
      
      void main() {
        // Shift the UV coordinates based on mouse position
        vec2 shifted_uv = v_uv - u_mouse;
        
        // Apply rotation based on gradient angle
        float angle = u_gradientAngle * 3.14159 / 180.0; // Convert degrees to radians
        float cos_a = cos(angle);
        float sin_a = sin(angle);
        vec2 center = vec2(0.5, 0.5);
        vec2 rotated_uv = center + vec2(
          (shifted_uv.x - center.x) * cos_a - (shifted_uv.y - center.y) * sin_a,
          (shifted_uv.x - center.x) * sin_a + (shifted_uv.y - center.y) * cos_a
        );
        
        // Create a tangent-based gradient morphing
        // Calculate distance from center
        float distFromCenter = distance(rotated_uv, center);
        
        // Create a tangent curve - the gradient follows a curved path
        float tangentCurve = sin(distFromCenter * 3.14159 * 2.0) * 0.1;
        
        // Apply tangent morphing to the gradient
        float gradient = abs(rotated_uv.x * 1.0 / u_gradientWidth - rotated_uv.y + tangentCurve);
        gradient = 1.0 - gradient;
        
        // Create inner border effect with fixed physical thickness and gradient fade
        float borderThickness = u_borderThickness; // Border thickness in pixels
        float cornerRadius = u_borderRadius; // Corner radius in pixels
        float border = 0.0;
        
        // Convert UV to pixel coordinates
        vec2 pixelCoord = v_uv * u_resolution;
        
        // Calculate distance from edges
        float distFromLeft = pixelCoord.x;
        float distFromRight = u_resolution.x - pixelCoord.x;
        float distFromTop = pixelCoord.y;
        float distFromBottom = u_resolution.y - pixelCoord.y;
        
        // Calculate distance to rounded corners
        vec2 cornerDistances = vec2(
          min(distFromLeft, distFromRight),
          min(distFromTop, distFromBottom)
        );
        
        // Check if we're in a corner region
        bool inCornerRegion = (distFromLeft < cornerRadius && distFromTop < cornerRadius) ||
                             (distFromRight < cornerRadius && distFromTop < cornerRadius) ||
                             (distFromLeft < cornerRadius && distFromBottom < cornerRadius) ||
                             (distFromRight < cornerRadius && distFromBottom < cornerRadius);
        
        float minDistToEdge;
        
        if (inCornerRegion) {
          // In corner region, calculate distance to rounded corner
          vec2 cornerCenter;
          if (distFromLeft < cornerRadius && distFromTop < cornerRadius) {
            cornerCenter = vec2(cornerRadius, cornerRadius);
          } else if (distFromRight < cornerRadius && distFromTop < cornerRadius) {
            cornerCenter = vec2(u_resolution.x - cornerRadius, cornerRadius);
          } else if (distFromLeft < cornerRadius && distFromBottom < cornerRadius) {
            cornerCenter = vec2(cornerRadius, u_resolution.y - cornerRadius);
          } else {
            cornerCenter = vec2(u_resolution.x - cornerRadius, u_resolution.y - cornerRadius);
          }
          
          float distToCornerCenter = distance(pixelCoord, cornerCenter);
          minDistToEdge = cornerRadius - distToCornerCenter;
        } else {
          // Not in corner region, use regular edge distance
          minDistToEdge = min(min(distFromLeft, distFromRight), min(distFromTop, distFromBottom));
        }
        
        // Create gradient border effect - stronger closer to edge
        if (minDistToEdge < borderThickness) {
          // Normalize distance to 0-1 range within border area
          float normalizedDist = minDistToEdge / borderThickness;
          // Invert so 0 = at edge (strong border), 1 = at border edge (no border)
          border = 1.0 - normalizedDist;
        }

        // Apply custom mapping to the border factor using the provided function
        float x = 1.0 - border; // Scale border to appropriate range for the function
        float customBorder = 0.5 * exp(-7.0 * x / 0.3) + 0.5 + 0.5 * exp(-pow(7.0 * x - 4.2, 2.0) / (2.0 * 0.35 * 0.35)) - 1.0 / (1.98 + exp(-(7.0 * x - 5.5) / 0.4));
        float warpStrength = customBorder * u_warpValue; // Use uniform warp value

        vec2 center_to_uv = rotated_uv - center;
        vec2 warped_uv = rotated_uv + vec2(warpStrength * center_to_uv.x, -warpStrength * center_to_uv.y);

        // Sample gradient from warped position with tangent morphing
        float warpedDistFromCenter = distance(warped_uv, center);
        float warpedTangentCurve = sin(warpedDistFromCenter * 3.14159 * 2.0) * 0.1;
        float warpedGradient = abs(warped_uv.x * 1.0 / u_gradientWidth - warped_uv.y + warpedTangentCurve);
        warpedGradient = 1.0 - warpedGradient; 

        // Create color gradient from dark to middle to light
        vec3 darkBlue = u_darkColor;   // Use uniform dark color
        vec3 middleBlue = u_middleColor; // Use uniform middle color
        vec3 lightBlue = u_lightColor; // Use uniform light color
        
        // Interpolate between three colors based on gradient value
        vec3 gradientColor;
        vec3 warpedColor;
        
        if (gradient < 0.5) {
          // Interpolate between dark and middle color
          float t = gradient * 2.0; // Scale 0-0.5 to 0-1
          gradientColor = mix(darkBlue, middleBlue, t);
        } else {
          // Interpolate between middle and light color
          float t = (gradient - 0.5) * 2.0; // Scale 0.5-1 to 0-1
          gradientColor = mix(middleBlue, lightBlue, t);
        }
        
        if (warpedGradient < 0.5) {
          // Interpolate between dark and middle color
          float t = warpedGradient * 2.0; // Scale 0-0.5 to 0-1
          warpedColor = mix(darkBlue, middleBlue, t);
        } else {
          // Interpolate between middle and light color
          float t = (warpedGradient - 0.5) * 2.0; // Scale 0.5-1 to 0-1
          warpedColor = mix(middleBlue, lightBlue, t);
        }
        
        // Use border color if border > 0.0, otherwise use gradient color
        vec3 finalColor = border > 0.0 ? warpedColor : gradientColor;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    // Function to create and compile a shader
    const createShader = (gl: WebGLRenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type);
      
      if (!shader) {
        console.error('Failed to create shader');
        return null;
      }

      gl.shaderSource(shader, source);
      gl.compileShader(shader);

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Error compiling shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }

      return shader;
    };

    // Function to create the shader program
    const createProgram = (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) => {
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Error linking program:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
      }

      return program;
    };

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    if (!vertexShader || !fragmentShader) {
      return;
    }

    // Create program
    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      return;
    }

    // Get attribute and uniform locations
    const positionAttributeLocation = gl.getAttribLocation(program, 'a_position');
    const mouseUniformLocation = gl.getUniformLocation(program, 'u_mouse');
    const resolutionUniformLocation = gl.getUniformLocation(program, 'u_resolution');
    const darkColorUniformLocation = gl.getUniformLocation(program, 'u_darkColor');
    const lightColorUniformLocation = gl.getUniformLocation(program, 'u_lightColor');
    const middleColorUniformLocation = gl.getUniformLocation(program, 'u_middleColor');
    const warpValueUniformLocation = gl.getUniformLocation(program, 'u_warpValue');
    const borderRadiusUniformLocation = gl.getUniformLocation(program, 'u_borderRadius');
    const borderThicknessUniformLocation = gl.getUniformLocation(program, 'u_borderThickness');
    const gradientWidthUniformLocation = gl.getUniformLocation(program, 'u_gradientWidth');
    const gradientAngleUniformLocation = gl.getUniformLocation(program, 'u_gradientAngle');

    // Create buffer for a full-screen quad
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    // Define vertices for a full-screen quad
    const positions = [
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    // Set up rendering
    const render = () => {
      // Set viewport
      gl.viewport(0, 0, canvas.width, canvas.height);

      // Clear canvas
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use shader program
      gl.useProgram(program);

      // Calculate mouse position with smooth offset transition
      const offsetAmount = 0.4;
      const offsetX = offsetProgress * offsetAmount;
      const offsetY = offsetProgress * offsetAmount;
      const adjustedMouseX = mousePosition.x + offsetX;
      const adjustedMouseY = mousePosition.y + offsetY;
      
      // Set mouse uniform
      gl.uniform2f(mouseUniformLocation, adjustedMouseX, -adjustedMouseY);
      
      // Set resolution uniform
      gl.uniform2f(resolutionUniformLocation, canvas.width, canvas.height);

      // Set color uniforms
      gl.uniform3f(darkColorUniformLocation, darkColor.r, darkColor.g, darkColor.b);
      gl.uniform3f(lightColorUniformLocation, lightColor.r, lightColor.g, lightColor.b);
      gl.uniform3f(middleColorUniformLocation, middleColor.r, middleColor.g, middleColor.b);

      // Set warp and border radius uniforms
      gl.uniform1f(warpValueUniformLocation, warpValue);
      gl.uniform1f(borderRadiusUniformLocation, borderRadius);
      gl.uniform1f(borderThicknessUniformLocation, borderThickness);
      gl.uniform1f(gradientWidthUniformLocation, gradientWidth);
      gl.uniform1f(gradientAngleUniformLocation, gradientAngle);

      // Enable attribute
      gl.enableVertexAttribArray(positionAttributeLocation);

      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Set up attribute pointer
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    // Handle canvas resize
    const resizeCanvas = () => {
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;

      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        render();
      }
    };

    // Set initial size and render
    resizeCanvas();
    render();

    // Set up resize observer
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // Mouse event handlers
    const handleMouseMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1;
      const y = (event.clientY / window.innerHeight) * 2 - 1;
      setMousePosition({ x, y });
    };

    const handleMouseDown = () => {
      setIsMousePressed(true);
    };

    const handleMouseUp = () => {
      setIsMousePressed(false);
    };

    // Add event listeners to window for global mouse tracking
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
    };
  }, [mousePosition, offsetProgress, darkColor, lightColor, middleColor, warpValue, borderRadius, borderThickness, gradientWidth, gradientAngle]);

  return (
    <div className="w-full h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-full max-w-xl h-64 overflow-hidden cursor-pointer hover:scale-105 transition-all duration-200 active:scale-95 shadow-2xl shadow-[#a1b8d1]/10 active:shadow-[#569ce8]/40 relative" style={{ borderRadius: `${borderRadius}px` }}>
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />
        <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl font-black z-100 select-none w-full text-center" style={{ mixBlendMode: 'difference', color: 'white' }}>Hello world!</p>
      </div>
      
      {/* Controls Panel */}
      <div className="fixed top-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg p-4 text-white min-w-64">
        <h3 className="text-lg font-semibold mb-4">Controls</h3>
        
        {/* Dark Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Dark Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={rgbToHex(darkColor.r, darkColor.g, darkColor.b)}
              onChange={(e) => setDarkColor(hexToRgb(e.target.value))}
              className="w-12 h-8 rounded border border-gray-600"
            />
            <span className="text-xs text-gray-300">
              {rgbToHex(darkColor.r, darkColor.g, darkColor.b)}
            </span>
          </div>
        </div>

        {/* Light Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Light Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={rgbToHex(lightColor.r, lightColor.g, lightColor.b)}
              onChange={(e) => setLightColor(hexToRgb(e.target.value))}
              className="w-12 h-8 rounded border border-gray-600"
            />
            <span className="text-xs text-gray-300">
              {rgbToHex(lightColor.r, lightColor.g, lightColor.b)}
            </span>
          </div>
        </div>

        {/* Middle Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Middle Color</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={rgbToHex(middleColor.r, middleColor.g, middleColor.b)}
              onChange={(e) => setMiddleColor(hexToRgb(e.target.value))}
              className="w-12 h-8 rounded border border-gray-600"
            />
            <span className="text-xs text-gray-300">
              {rgbToHex(middleColor.r, middleColor.g, middleColor.b)}
            </span>
          </div>
        </div>

        {/* Warp Value */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Warp Value</label>
          <input
            type="range"
            min="-5"
            max="5"
            step="0.1"
            value={warpValue}
            onChange={(e) => setWarpValue(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{warpValue.toFixed(1)}</span>
        </div>

        {/* Border Radius */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Border Radius</label>
          <input
            type="range"
            min="0"
            max="128"
            step="8"
            value={borderRadius}
            onChange={(e) => setBorderRadius(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{borderRadius}px</span>
        </div>

        {/* Border Thickness */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Border Thickness</label>
          <input
            type="range"
            min="0"
            max="64"
            step="4"
            value={borderThickness}
            onChange={(e) => setBorderThickness(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{borderThickness}px</span>
        </div>

        {/* Gradient Width */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Gradient Width</label>
          <input
            type="range"
            min="0.0"
            max="1"
            step="0.1"
            value={gradientWidth}
            onChange={(e) => setGradientWidth(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{gradientWidth.toFixed(1)}</span>
        </div>

        {/* Gradient Angle */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Gradient Angle</label>
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={gradientAngle}
            onChange={(e) => setGradientAngle(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{gradientAngle}°</span>
        </div>
      </div>
    </div>
  );
};

export default WebGLGradient;