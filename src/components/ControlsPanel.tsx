import React from 'react';
import { rgbToHex, hexToRgb } from '../utils/colorUtils';

interface Color {
  r: number;
  g: number;
  b: number;
}

interface ControlsPanelProps {
  darkColor: Color;
  setDarkColor: (color: Color) => void;
  middleColor: Color;
  setMiddleColor: (color: Color) => void;
  lightColor: Color;
  setLightColor: (color: Color) => void;
  gradientAngle: number;
  setGradientAngle: (angle: number) => void;
  gradientRepeating: boolean;
  setGradientRepeating: (repeating: boolean) => void;
  warpValue: number;
  setWarpValue: (value: number) => void;
  borderRadius: number;
  setBorderRadius: (radius: number) => void;
  borderThickness: number;
  setBorderThickness: (thickness: number) => void;
  gradientWidth: number;
  setGradientWidth: (width: number) => void;
  noiseIntensity: number;
  setNoiseIntensity: (intensity: number) => void;
  noiseScale: number;
  setNoiseScale: (scale: number) => void;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({
  darkColor,
  setDarkColor,
  middleColor,
  setMiddleColor,
  lightColor,
  setLightColor,
  gradientAngle,
  setGradientAngle,
  gradientRepeating,
  setGradientRepeating,
  warpValue,
  setWarpValue,
  borderRadius,
  setBorderRadius,
  borderThickness,
  setBorderThickness,
  gradientWidth,
  setGradientWidth,
  noiseIntensity,
  setNoiseIntensity,
  noiseScale,
  setNoiseScale,
}) => {
  return (
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

      {/* Gradient Repeating Toggle */}
      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm font-medium mb-2">
          <input
            type="checkbox"
            checked={gradientRepeating}
            onChange={(e) => setGradientRepeating(e.target.checked)}
            className="w-4 h-4 rounded border border-gray-600"
          />
          Gradient Repeating
        </label>
      </div>

      {/* Warp Value */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Warp Value</label>
        <input
          type="range"
          min="0"
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
          max="2.0"
          step="0.1"
          value={gradientWidth}
          onChange={(e) => setGradientWidth(parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-xs">{gradientWidth.toFixed(1)}</span>
      </div>

      {/* Noise Controls */}
      <div className="border-t border-gray-600 pt-4 mt-4">
        <h4 className="text-md font-semibold mb-3">Noise Effect</h4>
        
        {/* Noise Intensity */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Noise Intensity</label>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={noiseIntensity}
            onChange={(e) => setNoiseIntensity(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{noiseIntensity.toFixed(2)}</span>
        </div>

        {/* Noise Scale */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Noise Scale</label>
          <input
            type="range"
            min="100"
            max="2000"
            step="50"
            value={noiseScale}
            onChange={(e) => setNoiseScale(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-xs">{noiseScale.toFixed(0)}</span>
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;
