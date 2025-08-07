import { useEffect, RefObject } from 'react';
import { vertexShaderSource } from '../shaders/vertexShader';
import { fragmentShaderSource } from '../shaders/fragmentShader';
import { noiseFragmentShaderSource } from '../shaders/noiseShader';
import { createShader, createProgram } from '../utils/webglUtils';

interface Color {
  r: number;
  g: number;
  b: number;
}

interface UseWebGLProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  offsetProgress: number;
  darkColor: Color;
  lightColor: Color;
  middleColor: Color;
  warpValue: number;
  borderRadius: number;
  borderThickness: number;
  gradientWidth: number;
  gradientAngle: number;
  gradientRepeating: boolean;
  noiseIntensity: number;
  noiseScale: number;
  currentMouseRef: RefObject<{ x: number; y: number }>;
  targetMouseRef: RefObject<{ x: number; y: number }>;
  mouseSmoothingFactor: number;
}

export const useWebGL = ({
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
}: UseWebGLProps) => {
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

    // Create shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const noiseFragmentShader = createShader(gl, gl.FRAGMENT_SHADER, noiseFragmentShaderSource);

    if (!vertexShader || !fragmentShader || !noiseFragmentShader) {
      return;
    }

    // Create programs
    const mainProgram = createProgram(gl, vertexShader, fragmentShader);
    const noiseProgram = createProgram(gl, vertexShader, noiseFragmentShader);
    
    if (!mainProgram || !noiseProgram) {
      return;
    }

    // Get attribute and uniform locations for main program
    const positionAttributeLocation = gl.getAttribLocation(mainProgram, 'a_position');
    const mouseUniformLocation = gl.getUniformLocation(mainProgram, 'u_mouse');
    const resolutionUniformLocation = gl.getUniformLocation(mainProgram, 'u_resolution');
    const darkColorUniformLocation = gl.getUniformLocation(mainProgram, 'u_darkColor');
    const lightColorUniformLocation = gl.getUniformLocation(mainProgram, 'u_lightColor');
    const middleColorUniformLocation = gl.getUniformLocation(mainProgram, 'u_middleColor');
    const warpValueUniformLocation = gl.getUniformLocation(mainProgram, 'u_warpValue');
    const borderRadiusUniformLocation = gl.getUniformLocation(mainProgram, 'u_borderRadius');
    const borderThicknessUniformLocation = gl.getUniformLocation(mainProgram, 'u_borderThickness');
    const gradientWidthUniformLocation = gl.getUniformLocation(mainProgram, 'u_gradientWidth');
    const gradientAngleUniformLocation = gl.getUniformLocation(mainProgram, 'u_gradientAngle');
    const gradientRepeatingUniformLocation = gl.getUniformLocation(mainProgram, 'u_gradientRepeating');

    // Get attribute and uniform locations for noise program
    const noisePositionAttributeLocation = gl.getAttribLocation(noiseProgram, 'a_position');
    const textureUniformLocation = gl.getUniformLocation(noiseProgram, 'u_texture');
    const noiseIntensityUniformLocation = gl.getUniformLocation(noiseProgram, 'u_noiseIntensity');
    const noiseScaleUniformLocation = gl.getUniformLocation(noiseProgram, 'u_noiseScale');

    // Create framebuffer for off-screen rendering
    const framebuffer = gl.createFramebuffer();
    const texture = gl.createTexture();
    
    // Set up the texture
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

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
    const render = (time: number) => {
      // Smooth mouse interpolation - runs on every frame using refs
      const dx = targetMouseRef.current.x - currentMouseRef.current.x;
      const dy = targetMouseRef.current.y - currentMouseRef.current.y;
      
      currentMouseRef.current.x += dx * mouseSmoothingFactor;
      currentMouseRef.current.y += dy * mouseSmoothingFactor;

      // Set viewport
      gl.viewport(0, 0, canvas.width, canvas.height);

      // First pass: render to framebuffer
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

      // Clear canvas
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // Use main shader program
      gl.useProgram(mainProgram);

      // Calculate mouse position with smooth offset transition
      const offsetAmount = 0.4;
      const offsetX = offsetProgress * offsetAmount;
      const offsetY = offsetProgress * offsetAmount;
      const adjustedMouseX = currentMouseRef.current.x + offsetX;
      const adjustedMouseY = currentMouseRef.current.y + offsetY;
      
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
      gl.uniform1f(gradientRepeatingUniformLocation, gradientRepeating ? 1.0 : 0.0);

      // Enable attribute
      gl.enableVertexAttribArray(positionAttributeLocation);

      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Set up attribute pointer
      gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // Second pass: render to screen with noise effect
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);

      // Use noise shader program
      gl.useProgram(noiseProgram);

      // Bind the texture from the first pass
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform1i(textureUniformLocation, 0);

      // Set noise uniforms
      gl.uniform1f(noiseIntensityUniformLocation, noiseIntensity);
      gl.uniform1f(noiseScaleUniformLocation, noiseScale);

      // Enable attribute
      gl.enableVertexAttribArray(noisePositionAttributeLocation);

      // Bind position buffer
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

      // Set up attribute pointer
      gl.vertexAttribPointer(noisePositionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

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
        
        // Resize the texture
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, canvas.width, canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    };

    // Set initial size
    resizeCanvas();

    // Animation loop
    let animationId: number;
    const animate = (time: number) => {
      render(time);
      animationId = requestAnimationFrame(animate);
    };
    animate(0);

    // Set up resize observer
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteShader(noiseFragmentShader);
      gl.deleteProgram(mainProgram);
      gl.deleteProgram(noiseProgram);
      gl.deleteBuffer(positionBuffer);
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
    };
  }, [offsetProgress, darkColor, lightColor, middleColor, warpValue, borderRadius, borderThickness, gradientWidth, gradientAngle, gradientRepeating, noiseIntensity, noiseScale]);
};
