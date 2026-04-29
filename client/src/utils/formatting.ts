/**
 * Formatting utilities for race data display
 */

export const formatTime = (milliseconds: number): string => {
  if (milliseconds === 0 || !milliseconds) return '--:--';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const ms = Math.floor((milliseconds % 1000) / 10);
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const formatTimeWithoutMs = (milliseconds: number): string => {
  if (milliseconds === 0 || !milliseconds) return '--:--';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatGap = (gapMs: number): string => {
  if (gapMs === 0) return 'LEADER';
  if (gapMs < 1000) return `+${gapMs}ms`;
  return `+${formatTime(gapMs)}`;
};

export const formatSpeed = (kmh: number): string => {
  if (!kmh || kmh === 0) return '-- km/h';
  return `${kmh.toFixed(1)} km/h`;
};

export const formatDistance = (meters: number): string => {
  if (!meters || meters === 0) return '-- m';
  
  if (meters < 1000) {
    return `${meters.toFixed(0)} m`;
  } else {
    return `${(meters / 1000).toFixed(2)} km`;
  }
};

export const formatDuration = (milliseconds: number): string => {
  if (milliseconds === 0 || !milliseconds) return '0:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatLapTime = (lapTime: number): string => {
  return formatTime(lapTime);
};

export const formatPosition = (position: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return `${position}${suffix}`;
};

export const formatAntiCheatRisk = (risk: number): string => {
  if (risk === 0) return 'Safe';
  if (risk < 30) return 'Low Risk';
  if (risk < 70) return 'Medium Risk';
  return 'High Risk';
};

export const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatNumber = (num: number, decimals: number = 0): string => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

export const formatCoordinates = (lat: number, lng: number, decimals: number = 6): string => {
  return `${lat.toFixed(decimals)}°, ${lng.toFixed(decimals)}°`;
};

export const formatAcceleration = (acceleration: number): string => {
  return `${acceleration.toFixed(1)} km/h/s`;
};

export const formatHeading = (degrees: number): string => {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return `${degrees.toFixed(0)}° ${directions[index]}`;
};

export const formatGForce = (g: number): string => {
  return `${g.toFixed(2)}g`;
};

export const formatTemperature = (celsius: number): string => {
  return `${celsius.toFixed(1)}°C`;
};

export const formatPressure = (hPa: number): string => {
  return `${hPa.toFixed(0)} hPa`;
};

export const formatHumidity = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatWindSpeed = (kmh: number): string => {
  return `${kmh.toFixed(1)} km/h`;
};

export const formatVisibility = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

export const formatTrackLength = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

export const formatRaceDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

export const formatPitStopTime = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const ms = milliseconds % 1000;
  
  if (seconds > 0) {
    return `${seconds}.${Math.floor(ms / 100)}s`;
  } else {
    return `${ms}ms`;
  }
};

export const formatTireWear = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatFuelLevel = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatEngineRPM = (rpm: number): string => {
  return `${rpm.toFixed(0)} RPM`;
};

export const formatGear = (gear: number): string => {
  if (gear === 0) return 'N';
  if (gear === -1) return 'R';
  return gear.toString();
};

export const formatDRS = (drs: boolean): string => {
  return drs ? 'ON' : 'OFF';
};

export const formatERS = (ers: 'deploying' | 'harvesting' | 'off'): string => {
  return ers.toUpperCase();
};

export const formatBrakeBias = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatTurboPressure = (bar: number): string => {
  return `${bar.toFixed(1)} bar`;
};

export const formatOilTemp = (celsius: number): string => {
  return `${celsius.toFixed(0)}°C`;
};

export const formatWaterTemp = (celsius: number): string => {
  return `${celsius.toFixed(0)}°C`;
};

export const formatBrakeTemp = (celsius: number): string => {
  return `${celsius.toFixed(0)}°C`;
};

export const formatTyreTemp = (celsius: number): string => {
  return `${celsius.toFixed(0)}°C`;
};

export const formatTyrePressure = (psi: number): string => {
  return `${psi.toFixed(1)} PSI`;
};

export const formatLapCount = (current: number, total: number): string => {
  return `${current}/${total}`;
};

export const formatRacePosition = (position: number, total: number): string => {
  return `${position}/${total}`;
};

export const formatPoints = (points: number): string => {
  return points.toString();
};

export const formatChampionshipPosition = (position: number): string => {
  return `${position}${getPositionSuffix(position)}`;
};

function getPositionSuffix(position: number): string {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = position % 100;
  const suffix = suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
  return suffix;
}

export const formatQualifyingTime = (milliseconds: number): string => {
  return formatTime(milliseconds);
};

export const formatSectorTime = (milliseconds: number): string => {
  return formatTime(milliseconds);
};

export const formatSplitTime = (milliseconds: number): string => {
  if (milliseconds > 0) {
    return `+${formatTime(milliseconds)}`;
  } else if (milliseconds < 0) {
    return `-${formatTime(Math.abs(milliseconds))}`;
  }
  return '0.000';
};

export const formatDelta = (milliseconds: number): string => {
  if (milliseconds > 0) {
    return `+${formatTime(milliseconds)}`;
  } else if (milliseconds < 0) {
    return `-${formatTime(Math.abs(milliseconds))}`;
  }
  return '0.000';
};

export const formatTrackPosition = (position: number, totalPositions: number): string => {
  const percentage = (position / totalPositions) * 100;
  return `${position}/${totalPositions} (${percentage.toFixed(1)}%)`;
};

export const formatSessionTime = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const formatWeatherCode = (code: number): string => {
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear',
    1: 'Cloudy',
    2: 'Overcast',
    3: 'Light Rain',
    4: 'Heavy Rain',
    5: 'Storm',
    6: 'Snow',
    7: 'Fog'
  };
  
  return weatherCodes[code] || 'Unknown';
};

export const formatWindDirection = (degrees: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
};

export const formatCloudCover = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatAirDensity = (kgPerM3: number): string => {
  return `${kgPerM3.toFixed(3)} kg/m³`;
};

export const formatAirTemp = (celsius: number): string => {
  return `${celsius.toFixed(1)}°C`;
};

export const formatTrackTemp = (celsius: number): string => {
  return `${celsius.toFixed(1)}°C`;
};

export const formatGripLevel = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatMarbles = (percentage: number): string => {
  return `${percentage.toFixed(0)}%`;
};

export const formatEvolution = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`;
};
