"use client";

import React, { useEffect, useRef, useState } from 'react';

const WebGLGradient = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });

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
    const vertexShaderSource = `
      attribute vec2 a_position;
      varying vec2 v_uv;
      
      void main() {
        v_uv = (a_position + 1.0) * 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader source - creates white to black to white gradient with mouse offset
    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform vec2 u_mouse;
      
      void main() {
        // Shift the UV coordinates based on mouse position
        vec2 shifted_uv = v_uv - u_mouse * 1.0;
        
        // Apply a slight rotation (about 15 degrees)
        float angle = 0.261799; // 15 degrees in radians
        float cos_a = cos(angle);
        float sin_a = sin(angle);
        vec2 center = vec2(0.5, 0.5);
        vec2 rotated_uv = center + vec2(
          (shifted_uv.x - center.x) * cos_a - (shifted_uv.y - center.y) * sin_a,
          (shifted_uv.x - center.x) * sin_a + (shifted_uv.y - center.y) * cos_a
        );
        
        // Create a horizontal gradient from white to black to white
        float gradient = abs(rotated_uv.x * 2.0 - 1.0);
        gradient = 1.0 - gradient;
        
        gl_FragColor = vec4(gradient, gradient, gradient, 1.0);
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

      // Set mouse uniform
      gl.uniform2f(mouseUniformLocation, mousePosition.x, mousePosition.y);

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
      const x = event.clientX / window.innerWidth;
      const y = event.clientY / window.innerHeight;
      setMousePosition({ x, y });
    };

    // Add event listeners to window for global mouse tracking
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup function
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
    };
  }, [mousePosition]);

  return (
    <div className="w-full h-screen bg-gray-900 flex items-center justify-center">
      <div className="w-full max-w-xl h-52 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    </div>
  );
};

export default WebGLGradient;