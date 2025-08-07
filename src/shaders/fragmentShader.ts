export const fragmentShaderSource = /* glsl */`
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
  uniform float u_gradientRepeating;
  
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
    
    // Create a tangent-based gradient morphing with modulo repetition
    // Calculate distance from center
    float distFromCenter = distance(rotated_uv, center);
    
    // Create a tangent curve - the gradient follows a curved path
    float tangentCurve = sin(distFromCenter * 3.14159 * 2.0) * 0.1;
    
    // Apply tangent morphing to the gradient with optional modulo repetition
    float gradient = abs(rotated_uv.x * 1.0 / u_gradientWidth - rotated_uv.y + tangentCurve);
    if (u_gradientRepeating > 0.5) {
      gradient = mod(gradient * 2.0, 2.0); // Scale and modulo to create repeating pattern
      gradient = 1.0 - abs(gradient - 1.0); // Create sawtooth pattern
    } else {
      gradient = 1.0 - gradient;
    }
    
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

    // Sample gradient from warped position with tangent morphing and optional modulo repetition
    float warpedDistFromCenter = distance(warped_uv, center);
    float warpedTangentCurve = sin(warpedDistFromCenter * 3.14159 * 2.0) * 0.1;
    float warpedGradient = abs(warped_uv.x * 1.0 / u_gradientWidth - warped_uv.y + warpedTangentCurve);
    if (u_gradientRepeating > 0.5) {
      warpedGradient = mod(warpedGradient * 2.0, 2.0); // Scale and modulo to create repeating pattern
      warpedGradient = 1.0 - abs(warpedGradient - 1.0); // Create sawtooth pattern
    } else {
      warpedGradient = 1.0 - warpedGradient;
    } 

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
