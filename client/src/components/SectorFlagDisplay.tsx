/**
 * Sector Flag Display Component
 * 
 * Displays sector-based flag information to drivers during a race
 * Shows current flag status for each sector with visual indicators
 */

import React, { useState, useEffect } from 'react';

export type FlagType = 'none' | 'green' | 'yellow' | 'double_yellow' | 'red' | 'blue' | 'checkered' | 'safety_car';

export interface Sector {
  id: string;
  name: string;
  order: number;
  startDistance: number;
  endDistance: number;
}

export interface SectorFlagState {
  sectorId: string;
  flag: FlagType;
  reason?: string;
  updatedAt: number;
}

interface SectorFlagDisplayProps {
  sectors: Sector[];
  sectorFlags: SectorFlagState[];
  currentDistance?: number;
  onFlagClick?: (sectorId: string) => void;
}

const flagColors: Record<FlagType, string> = {
  none: '#666666',
  green: '#00FF00',
  yellow: '#FFFF00',
  double_yellow: '#FFD700',
  red: '#FF0000',
  blue: '#0000FF',
  checkered: '#FFFFFF',
  safety_car: '#FFA500'
};

const flagLabels: Record<FlagType, string> = {
  none: 'No Flag',
  green: 'Green',
  yellow: 'Yellow',
  double_yellow: 'Double Yellow',
  red: 'Red',
  blue: 'Blue',
  checkered: 'Checkered',
  safety_car: 'Safety Car'
};

export const SectorFlagDisplay: React.FC<SectorFlagDisplayProps> = ({
  sectors,
  sectorFlags,
  currentDistance,
  onFlagClick
}) => {
  const [currentSector, setCurrentSector] = useState<Sector | null>(null);

  useEffect(() => {
    if (currentDistance !== undefined) {
      const sector = sectors.find(
        s => currentDistance >= s.startDistance && currentDistance < s.endDistance
      );
      setCurrentSector(sector || null);
    }
  }, [currentDistance, sectors]);

  const getFlagForSector = (sectorId: string): FlagType => {
    const flagState = sectorFlags.find(f => f.sectorId === sectorId);
    return flagState?.flag || 'green';
  };

  const getFlagStyle = (flag: FlagType, isCurrentSector: boolean) => ({
    backgroundColor: flagColors[flag],
    border: isCurrentSector ? '3px solid #fff' : '2px solid #333',
    boxShadow: isCurrentSector ? '0 0 10px rgba(255, 255, 255, 0.5)' : 'none',
    transform: isCurrentSector ? 'scale(1.1)' : 'scale(1)',
    transition: 'all 0.3s ease'
  });

  const getFlagIcon = (flag: FlagType): string => {
    switch (flag) {
      case 'green':
        return '🟢';
      case 'yellow':
        return '🟡';
      case 'double_yellow':
        return '🟡🟡';
      case 'red':
        return '🔴';
      case 'blue':
        return '🔵';
      case 'checkered':
        return '🏁';
      case 'safety_car':
        return '🚗';
      default:
        return '⚪';
    }
  };

  const getOverallStatus = (): FlagType => {
    const flagSeverity: Record<FlagType, number> = {
      none: 0,
      green: 1,
      blue: 2,
      yellow: 3,
      double_yellow: 4,
      safety_car: 5,
      red: 6,
      checkered: 7
    };

    let maxSeverity = 0;
    let overallFlag: FlagType = 'green';

    for (const flagState of sectorFlags) {
      const severity = flagSeverity[flagState.flag] || 0;
      if (severity > maxSeverity) {
        maxSeverity = severity;
        overallFlag = flagState.flag;
      }
    }

    return overallFlag;
  };

  const overallStatus = getOverallStatus();

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: '12px',
      padding: '16px',
      color: '#fff',
      fontFamily: 'Arial, sans-serif',
      zIndex: 1000,
      minWidth: '250px',
      backdropFilter: 'blur(10px)'
    }}>
      {/* Overall Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: flagColors[overallStatus],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          marginRight: '12px',
          border: '2px solid #fff'
        }}>
          {getFlagIcon(overallStatus)}
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ccc' }}>
            Track Status
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            {flagLabels[overallStatus]}
          </div>
        </div>
      </div>

      {/* Sector Flags */}
      <div style={{ marginBottom: '8px', fontSize: '12px', color: '#ccc', fontWeight: 'bold' }}>
        SECTOR FLAGS
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {sectors.map((sector) => {
          const flag = getFlagForSector(sector.id);
          const isCurrentSector = currentSector?.id === sector.id;
          const flagState = sectorFlags.find(f => f.sectorId === sector.id);

          return (
            <div
              key={sector.id}
              onClick={() => onFlagClick?.(sector.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                borderRadius: '8px',
                backgroundColor: isCurrentSector ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                cursor: onFlagClick ? 'pointer' : 'default',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                if (onFlagClick) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                }
              }}
              onMouseLeave={(e) => {
                if (onFlagClick) {
                  e.currentTarget.style.backgroundColor = isCurrentSector ? 'rgba(255, 255, 255, 0.1)' : 'transparent';
                }
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  ...getFlagStyle(flag, isCurrentSector),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  marginRight: '12px'
                }}
              >
                {getFlagIcon(flag)}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {sector.name}
                </div>
                {flagState?.reason && (
                  <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px' }}>
                    {flagState.reason}
                  </div>
                )}
              </div>

              {isCurrentSector && (
                <div style={{
                  fontSize: '10px',
                  backgroundColor: '#fff',
                  color: '#000',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: 'bold'
                }}>
                  CURRENT
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current Position Indicator */}
      {currentDistance !== undefined && currentSector && (
        <div style={{
          marginTop: '16px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)',
          fontSize: '12px',
          color: '#aaa'
        }}>
          Position: {currentDistance.toFixed(0)}m in {currentSector.name}
        </div>
      )}
    </div>
  );
};

export default SectorFlagDisplay;
