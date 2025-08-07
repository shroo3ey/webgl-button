export const noiseFragmentShaderSource = /* glsl */`
  precision mediump float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform float u_noiseIntensity;
  uniform float u_noiseScale;
  
  // Pseudo-random function
  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }
  
  // Noise function
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }
  
  void main() {
    // Sample the original texture
    vec4 originalColor = texture2D(u_texture, v_uv);
    
    // Generate static noise
    vec2 noiseCoord = v_uv * u_noiseScale;
    float noiseValue = noise(noiseCoord);
    
    // Apply noise to the color
    vec3 noiseColor = originalColor.rgb + (noiseValue - 0.5) * u_noiseIntensity;
    
    // Clamp to valid range
    noiseColor = clamp(noiseColor, 0.0, 1.0);
    
    gl_FragColor = vec4(noiseColor, originalColor.a);
  }
`;
