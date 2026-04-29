import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../services/leaderboard.service';

interface AnimatedEntryProps {
  entry: LeaderboardEntry;
  previousPosition?: number;
  isSelected?: boolean;
  children: React.ReactNode;
}

export const AnimatedEntry: React.FC<AnimatedEntryProps> = ({
  entry,
  previousPosition,
  isSelected,
  children
}) => {
  const [animationClass, setAnimationClass] = useState('');
  const [positionChange, setPositionChange] = useState(0);

  useEffect(() => {
    if (previousPosition !== undefined && previousPosition !== entry.position) {
      const change = previousPosition - entry.position;
      setPositionChange(change);
      
      if (change > 0) {
        setAnimationClass('animate-position-up');
      } else if (change < 0) {
        setAnimationClass('animate-position-down');
      }
      
      const timer = setTimeout(() => {
        setAnimationClass('');
        setPositionChange(0);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [entry.position, previousPosition]);

  const getPositionChangeIndicator = () => {
    if (positionChange === 0) return null;
    
    return (
      <span className={`ml-2 text-xs font-bold ${
        positionChange > 0 ? 'text-green-600' : 'text-red-600'
      }`}>
        {positionChange > 0 ? '↑' : '↓'} {Math.abs(positionChange)}
      </span>
    );
  };

  return (
    <div
      className={`leaderboard-entry transition-all duration-300 ${
        animationClass
      } ${
        isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
      }`}
    >
      {children}
      {getPositionChangeIndicator()}
    </div>
  );
};

interface ProgressBarProps {
  progress: number;
  color?: string;
  height?: string;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = 'blue',
  height = 'h-2',
  animated = true
}) => {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  return (
    <div className={`w-full ${height} bg-gray-200 rounded-full overflow-hidden`}>
      <div
        className={`h-full bg-${color}-500 transition-all duration-500 ease-out`}
        style={{ width: `${displayProgress}%` }}
      />
    </div>
  );
};

interface PulseIndicatorProps {
  active: boolean;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const PulseIndicator: React.FC<PulseIndicatorProps> = ({
  active,
  color = 'green',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${
        active ? `bg-${color}-500 animate-pulse` : 'bg-gray-400'
      }`}
    />
  );
};

interface SpeedIndicatorProps {
  speed: number;
  maxSpeed: number;
  className?: string;
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  speed,
  maxSpeed,
  className = ''
}) => {
  const percentage = Math.min((speed / maxSpeed) * 100, 100);
  
  const getColor = () => {
    if (percentage < 30) return 'bg-green-500';
    if (percentage < 60) return 'bg-yellow-500';
    if (percentage < 80) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`speed-indicator ${className}`}>
      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-gray-600 mt-1">{speed.toFixed(0)} km/h</div>
    </div>
  );
};

interface AntiCheatAlertProps {
  riskScore: number;
  showDetails?: boolean;
}

export const AntiCheatAlert: React.FC<AntiCheatAlertProps> = ({
  riskScore,
  showDetails = false
}) => {
  if (riskScore === 0) return null;

  const getAlertLevel = () => {
    if (riskScore < 30) return { level: 'low', color: 'yellow', icon: '⚠️' };
    if (riskScore < 70) return { level: 'medium', color: 'orange', icon: '⚡' };
    return { level: 'high', color: 'red', icon: '🚨' };
  };

  const alert = getAlertLevel();

  return (
    <div className={`anti-cheat-alert bg-${alert.color}-50 border border-${alert.color}-200 rounded p-2 animate-bounce`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{alert.icon}</span>
        <div>
          <div className={`text-sm font-medium text-${alert.color}-800`}>
            Anti-Cheat Alert
          </div>
          <div className={`text-xs text-${alert.color}-600`}>
            Risk Score: {riskScore}%
          </div>
          {showDetails && (
            <div className={`text-xs text-${alert.color}-500 mt-1`}>
              Unusual activity detected
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PositionBadgeProps {
  position: number;
  size?: 'sm' | 'md' | 'lg';
}

export const PositionBadge: React.FC<PositionBadgeProps> = ({
  position,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base'
  };

  const getStyle = () => {
    if (position === 1) return 'bg-yellow-500 text-white';
    if (position === 2) return 'bg-gray-400 text-white';
    if (position === 3) return 'bg-orange-600 text-white';
    return 'bg-gray-200 text-gray-700';
  };

  return (
    <div className={`${sizeClasses[size]} ${getStyle()} rounded-full flex items-center justify-center font-bold`}>
      {position}
    </div>
  );
};

interface LapCounterProps {
  currentLap: number;
  totalLaps: number;
  animated?: boolean;
}

export const LapCounter: React.FC<LapCounterProps> = ({
  currentLap,
  totalLaps,
  animated = true
}) => {
  const [displayLap, setDisplayLap] = useState(currentLap);

  useEffect(() => {
    if (animated && currentLap !== displayLap) {
      setDisplayLap(currentLap);
    }
  }, [currentLap, displayLap, animated]);

  return (
    <div className="lap-counter">
      <div className={`text-lg font-bold ${
        animated ? 'animate-pulse' : ''
      }`}>
        {displayLap}/{totalLaps}
      </div>
      <div className="text-xs text-gray-600">Lap</div>
    </div>
  );
};

interface TimeDisplayProps {
  time: number;
  type?: 'total' | 'lap' | 'gap';
  highlight?: boolean;
}

export const TimeDisplay: React.FC<TimeDisplayProps> = ({
  time,
  type = 'total',
  highlight = false
}) => {
  const formatTime = (ms: number): string => {
    if (ms === 0) return '--:--';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const getLabel = () => {
    switch (type) {
      case 'lap': return 'Lap';
      case 'gap': return 'Gap';
      default: return 'Time';
    }
  };

  return (
    <div className={`time-display ${highlight ? 'font-bold text-blue-600' : ''}`}>
      <div className="text-sm">{formatTime(time)}</div>
      <div className="text-xs text-gray-600">{getLabel()}</div>
    </div>
  );
};

interface StatusIndicatorProps {
  status: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  pulse = true
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return { color: 'green', text: 'Racing', icon: '🏁' };
      case 'finished':
        return { color: 'blue', text: 'Finished', icon: '🏆' };
      case 'disqualified':
        return { color: 'red', text: 'DQ', icon: '❌' };
      case 'dnf':
        return { color: 'gray', text: 'DNF', icon: '⚠️' };
      default:
        return { color: 'gray', text: 'Unknown', icon: '❓' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-1 px-2 py-1 rounded-full bg-${config.color}-100 text-${config.color}-800 text-xs font-medium ${
      pulse && status === 'active' ? 'animate-pulse' : ''
    }`}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </div>
  );
};

// CSS Animations (to be added to your CSS file)
export const leaderboardStyles = `
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes slideInDown {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes positionUp {
  0% {
    transform: translateY(10px);
    background-color: rgba(34, 197, 94, 0.1);
  }
  100% {
    transform: translateY(0);
    background-color: transparent;
  }
}

@keyframes positionDown {
  0% {
    transform: translateY(-10px);
    background-color: rgba(239, 68, 68, 0.1);
  }
  100% {
    transform: translateY(0);
    background-color: transparent;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(-25%);
    animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
  }
  50% {
    transform: translateY(0);
    animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
  }
}

.animate-slide-in-up {
  animation: slideInUp 0.3s ease-out;
}

.animate-slide-in-down {
  animation: slideInDown 0.3s ease-out;
}

.animate-position-up {
  animation: positionUp 1s ease-out;
}

.animate-position-down {
  animation: positionDown 1s ease-out;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

.leaderboard-entry {
  position: relative;
  overflow: hidden;
}

.leaderboard-entry::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.leaderboard-entry:hover::before {
  left: 100%;
}

.speed-indicator {
  transition: transform 0.2s;
}

.speed-indicator:hover {
  transform: scale(1.05);
}

.anti-cheat-alert {
  animation: bounce 1s infinite;
}

.time-display {
  font-family: 'Courier New', monospace;
  transition: color 0.3s;
}

.lap-counter {
  transition: transform 0.3s;
}

.lap-counter.animate-pulse:hover {
  transform: scale(1.1);
}
`;

export default {
  AnimatedEntry,
  ProgressBar,
  PulseIndicator,
  SpeedIndicator,
  AntiCheatAlert,
  PositionBadge,
  LapCounter,
  TimeDisplay,
  StatusIndicator,
  leaderboardStyles
};
