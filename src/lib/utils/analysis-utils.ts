import { Sample, FrequencyPeak } from '@/lib/types'
import { formatFrequency } from './space-utils'

/**
 * Calculates the room modes based on room dimensions
 * @param length Room length in meters
 * @param width Room width in meters
 * @param height Room height in meters
 * @returns Object containing axial, tangential, and oblique room modes
 */
export function calculateRoomModes(length: number, width: number, height: number) {
  const speedOfSound = 343; // m/s
  const axialModes: number[] = [];
  const tangentialModes: number[] = [];
  const obliqueModes: number[] = [];
  
  // Calculate axial modes (1D)
  for (let i = 1; i <= 5; i++) {
    axialModes.push((i * speedOfSound) / (2 * length));
    axialModes.push((i * speedOfSound) / (2 * width));
    axialModes.push((i * speedOfSound) / (2 * height));
  }
  
  // Calculate tangential modes (2D)
  for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 3; j++) {
      tangentialModes.push(
        (speedOfSound / 2) * Math.sqrt((i / length) ** 2 + (j / width) ** 2)
      );
      tangentialModes.push(
        (speedOfSound / 2) * Math.sqrt((i / length) ** 2 + (j / height) ** 2)
      );
      tangentialModes.push(
        (speedOfSound / 2) * Math.sqrt((i / width) ** 2 + (j / height) ** 2)
      );
    }
  }
  
  // Calculate oblique modes (3D)
  for (let i = 1; i <= 2; i++) {
    for (let j = 1; j <= 2; j++) {
      for (let k = 1; k <= 2; k++) {
        obliqueModes.push(
          (speedOfSound / 2) * Math.sqrt(
            (i / length) ** 2 + (j / width) ** 2 + (k / height) ** 2
          )
        );
      }
    }
  }
  
  return {
    axial: axialModes.sort((a, b) => a - b),
    tangential: tangentialModes.sort((a, b) => a - b),
    oblique: obliqueModes.sort((a, b) => a - b)
  };
}

/**
 * Identifies potential room modes from a sample's frequency peaks
 * @param sample The audio sample with frequency peaks
 * @param roomModes Calculated room modes
 * @param tolerance Tolerance percentage for matching (default 10%)
 * @returns Array of matched peaks with mode type
 */
export function identifyRoomModes(
  sample: Sample, 
  roomModes: { axial: number[], tangential: number[], oblique: number[] },
  tolerance: number = 10
) {
  if (!sample.peaks || sample.peaks.length === 0) {
    return [];
  }
  
  const matches: Array<{ peak: FrequencyPeak, modeType: string, modeFreq: number }> = [];
  const toleranceFactor = tolerance / 100;
  
  // Check each peak against room modes
  for (const peak of sample.peaks) {
    // Check axial modes
    for (const mode of roomModes.axial) {
      if (Math.abs(peak.frequency - mode) / mode <= toleranceFactor) {
        matches.push({ peak, modeType: 'axial', modeFreq: mode });
        break;
      }
    }
    
    // Check tangential modes
    for (const mode of roomModes.tangential) {
      if (Math.abs(peak.frequency - mode) / mode <= toleranceFactor) {
        matches.push({ peak, modeType: 'tangential', modeFreq: mode });
        break;
      }
    }
    
    // Check oblique modes
    for (const mode of roomModes.oblique) {
      if (Math.abs(peak.frequency - mode) / mode <= toleranceFactor) {
        matches.push({ peak, modeType: 'oblique', modeFreq: mode });
        break;
      }
    }
  }
  
  return matches;
}

/**
 * Generates a textual analysis of a sample's frequency content
 * @param sample The audio sample to analyze
 * @returns Analysis text
 */
export function generateAnalysisText(sample: Sample): string {
  if (!sample.peaks || sample.peaks.length === 0) {
    return "No significant resonance detected in this recording.";
  }
  
  // Get the top 3 peaks by amplitude
  const topPeaks = [...sample.peaks].sort((a, b) => b.amplitude - a.amplitude).slice(0, 3);
  
  // Check if there are strong low frequency resonances
  const lowFreqPeaks = topPeaks.filter(p => p.frequency < 200);
  const midFreqPeaks = topPeaks.filter(p => p.frequency >= 200 && p.frequency < 1000);
  const highFreqPeaks = topPeaks.filter(p => p.frequency >= 1000);
  
  let analysis = "";
  
  if (lowFreqPeaks.length > 0) {
    analysis += `Strong low frequency resonance detected at ${formatFrequency(lowFreqPeaks[0].frequency)}. `;
    analysis += "This may indicate structural vibrations or HVAC system issues. ";
  }
  
  if (midFreqPeaks.length > 0) {
    analysis += `Notable mid-range resonance at ${formatFrequency(midFreqPeaks[0].frequency)}. `;
    analysis += "This could be related to room dimensions or interior features. ";
  }
  
  if (highFreqPeaks.length > 0) {
    analysis += `High frequency components at ${formatFrequency(highFreqPeaks[0].frequency)}. `;
    analysis += "Typically associated with smaller objects or electronic equipment. ";
  }
  
  if (sample.spectralData?.snr !== undefined) {
    if (sample.spectralData.snr > 30) {
      analysis += "Excellent signal-to-noise ratio indicates clear resonance patterns. ";
    } else if (sample.spectralData.snr > 15) {
      analysis += "Good signal-to-noise ratio provides reliable analysis. ";
    } else {
      analysis += "Low signal-to-noise ratio may affect analysis accuracy. Consider re-recording in quieter conditions. ";
    }
  }
  
  if (analysis === "") {
    analysis = "Analysis complete. No significant building resonance issues detected in this recording.";
  } else {
    analysis += "Consider multiple recordings at different locations for comprehensive analysis.";
  }
  
  return analysis;
}

/**
 * Calculates the critical frequency for a given material thickness
 * @param thickness Material thickness in mm
 * @param density Material density in kg/m³
 * @param youngsModulus Young's modulus in Pa
 * @returns Critical frequency in Hz
 */
export function calculateCriticalFrequency(
  thickness: number, 
  density: number, 
  youngsModulus: number
): number {
  // Convert thickness from mm to m
  const thicknessM = thickness / 1000;
  
  // Critical frequency formula: fc = (c²/2π) * √(m/D)
  // where c is speed of sound, m is mass per unit area, D is bending stiffness
  const speedOfSound = 343; // m/s
  const massPerArea = density * thicknessM; // kg/m²
  const bendingStiffness = (youngsModulus * thicknessM**3) / (12 * (1 - 0.3**2)); // Assuming Poisson's ratio of 0.3
  
  const criticalFreq = (speedOfSound**2 / (2 * Math.PI)) * Math.sqrt(massPerArea / bendingStiffness);
  
  return criticalFreq;
}

/**
 * Estimates reverberation time based on room volume and absorption
 * @param volume Room volume in m³
 * @param totalAbsorption Total absorption in m² sabins
 * @returns Reverberation time in seconds
 */
export function calculateReverbTime(volume: number, totalAbsorption: number): number {
  // Sabine's formula: RT60 = 0.161 * V / A
  // where V is room volume, A is total absorption
  return 0.161 * volume / totalAbsorption;
}

/**
 * Calculates the Schroeder frequency for a room
 * @param volume Room volume in m³
 * @param reverbTime Reverberation time in seconds
 * @returns Schroeder frequency in Hz
 */
export function calculateSchroederFrequency(volume: number, reverbTime: number): number {
  // Schroeder frequency formula: f_s = 2000 * √(RT60/V)
  return 2000 * Math.sqrt(reverbTime / volume);
}

/**
 * Estimates the modal density of a room
 * @param volume Room volume in m³
 * @param frequency Frequency in Hz
 * @returns Modal density (modes per Hz)
 */
export function calculateModalDensity(volume: number, frequency: number): number {
  // Modal density formula: n(f) = 4πf²V/c³
  const speedOfSound = 343; // m/s
  return (4 * Math.PI * frequency**2 * volume) / (speedOfSound**3);
}