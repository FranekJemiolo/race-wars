/**
 * Multi-Camera View Component
 * 
 * Allows spectators to view multiple camera angles simultaneously:
 * - Track overview
 * - Individual car cameras
 * - Pit lane camera
 * - Start/finish line camera
 * - Sector cameras
 * - Custom camera layouts
 */

import React, { useState, useEffect } from 'react';

interface Camera {
  id: string;
  name: string;
  type: 'track' | 'car' | 'pit' | 'start_finish' | 'sector' | 'custom';
  participantId?: string;
  sector?: number;
  position?: { lat: number; lng: number };
  heading?: number;
  zoom?: number;
}

interface CameraLayout {
  id: string;
  name: string;
  cameras: Camera[];
  grid: { rows: number; cols: number };
}

interface MultiCameraViewProps {
  sessionId: string;
  onExit?: () => void;
}

export const MultiCameraView: React.FC<MultiCameraViewProps> = ({
  sessionId,
  onExit,
}) => {
  const [availableCameras, setAvailableCameras] = useState<Camera[]>([]);
  const [activeCameras, setActiveCameras] = useState<Camera[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<string>('2x2');
  const [isLoading, setIsLoading] = useState(true);
  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);

  const layouts: CameraLayout[] = [
    { id: '1x1', name: 'Single', cameras: [], grid: { rows: 1, cols: 1 } },
    { id: '2x1', name: '2 Cameras', cameras: [], grid: { rows: 1, cols: 2 } },
    { id: '1x2', name: '2 Stacked', cameras: [], grid: { rows: 2, cols: 1 } },
    { id: '2x2', name: '4 Cameras', cameras: [], grid: { rows: 2, cols: 2 } },
    { id: '3x2', name: '6 Cameras', cameras: [], grid: { rows: 2, cols: 3 } },
    { id: '3x3', name: '9 Cameras', cameras: [], grid: { rows: 3, cols: 3 } },
  ];

  useEffect(() => {
    loadAvailableCameras();
    setDefaultCameras();
  }, [sessionId]);

  const loadAvailableCameras = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockCameras: Camera[] = [
        { id: 'track', name: 'Track Overview', type: 'track' },
        { id: 'pit', name: 'Pit Lane', type: 'pit' },
        { id: 'start_finish', name: 'Start/Finish', type: 'start_finish' },
        { id: 'sector1', name: 'Sector 1', type: 'sector', sector: 1 },
        { id: 'sector2', name: 'Sector 2', type: 'sector', sector: 2 },
        { id: 'sector3', name: 'Sector 3', type: 'sector', sector: 3 },
        { id: 'car1', name: 'Car #42', type: 'car', participantId: '1' },
        { id: 'car2', name: 'Car #7', type: 'car', participantId: '2' },
        { id: 'car3', name: 'Car #11', type: 'car', participantId: '3' },
      ];

      setAvailableCameras(mockCameras);
    } catch (error) {
      console.error('Failed to load cameras:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setDefaultCameras = () => {
    const defaultCameras: Camera[] = [
      { id: 'track', name: 'Track Overview', type: 'track' },
      { id: 'pit', name: 'Pit Lane', type: 'pit' },
      { id: 'start_finish', name: 'Start/Finish', type: 'start_finish' },
      { id: 'car1', name: 'Car #42', type: 'car', participantId: '1' },
    ];
    setActiveCameras(defaultCameras);
  };

  const addCamera = (camera: Camera) => {
    const layout = layouts.find(l => l.id === selectedLayout);
    if (!layout) return;

    if (activeCameras.length >= layout.grid.rows * layout.grid.cols) {
      alert('Maximum cameras for this layout reached');
      return;
    }

    setActiveCameras([...activeCameras, camera]);
  };

  const removeCamera = (cameraId: string) => {
    setActiveCameras(activeCameras.filter(c => c.id !== cameraId));
  };

  const getCurrentLayout = () => {
    return layouts.find(l => l.id === selectedLayout) || layouts[3]; // Default to 2x2
  };

  const renderCameraView = (camera: Camera, index: number) => {
    const layout = getCurrentLayout();
    const isFullscreen = fullscreenCamera === camera.id;

    return (
      <div
        key={camera.id}
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${
          isFullscreen ? 'fixed inset-0 z-50' : ''
        }`}
        style={
          !isFullscreen
            ? {
                aspectRatio: `${layout.grid.cols} / ${layout.grid.rows}`,
              }
            : {}
        }
      >
        {/* Camera header */}
        <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex items-center justify-between z-10">
          <span className="text-white text-sm font-medium">{camera.name}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFullscreenCamera(isFullscreen ? null : camera.id)}
              className="text-white hover:text-gray-300 text-sm"
            >
              {isFullscreen ? '⛶' : '⛶'}
            </button>
            {!isFullscreen && (
              <button
                onClick={() => removeCamera(camera.id)}
                className="text-white hover:text-red-300 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Camera content */}
        <div className="w-full h-full flex items-center justify-center">
          {camera.type === 'track' && (
            <TrackOverviewCamera />
          )}
          {camera.type === 'car' && (
            <CarCamera participantId={camera.participantId} />
          )}
          {camera.type === 'pit' && (
            <PitLaneCamera />
          )}
          {camera.type === 'start_finish' && (
            <StartFinishCamera />
          )}
          {camera.type === 'sector' && (
            <SectorCamera sector={camera.sector} />
          )}
        </div>

        {/* Live indicator */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black bg-opacity-50 px-2 py-1 rounded">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="text-white text-xs">LIVE</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading cameras...</div>;
  }

  const layout = getCurrentLayout();
  const emptySlots = layout.grid.rows * layout.grid.cols - activeCameras.length;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Multi-Camera View</h2>
        <div className="flex items-center gap-4">
          <select
            value={selectedLayout}
            onChange={(e) => setSelectedLayout(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {layouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={onExit}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Camera grid */}
      <div
        className="grid gap-2 mb-6"
        style={{
          gridTemplateColumns: `repeat(${layout.grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${layout.grid.rows}, 1fr)`,
        }}
      >
        {activeCameras.map((camera, index) => renderCameraView(camera, index))}
        
        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300"
          >
            <span className="text-gray-400">Empty Slot</span>
          </div>
        ))}
      </div>

      {/* Camera selector */}
      <div className="border-t pt-4">
        <h3 className="font-semibold mb-3">Available Cameras</h3>
        <div className="flex flex-wrap gap-2">
          {availableCameras.map((camera) => {
            const isActive = activeCameras.some(c => c.id === camera.id);
            return (
              <button
                key={camera.id}
                onClick={() => !isActive && addCamera(camera)}
                disabled={isActive}
                className={`px-3 py-2 rounded flex items-center gap-2 ${
                  isActive
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                <span>{getCameraIcon(camera.type)}</span>
                <span>{camera.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout presets */}
      <div className="mt-4 pt-4 border-t">
        <h3 className="font-semibold mb-3">Quick Layouts</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setActiveCameras([
                { id: 'track', name: 'Track Overview', type: 'track' },
                { id: 'pit', name: 'Pit Lane', type: 'pit' },
                { id: 'start_finish', name: 'Start/Finish', type: 'start_finish' },
                { id: 'car1', name: 'Car #42', type: 'car', participantId: '1' },
              ]);
              setSelectedLayout('2x2');
            }}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Standard (4 cams)
          </button>
          <button
            onClick={() => {
              setActiveCameras([
                { id: 'car1', name: 'Car #42', type: 'car', participantId: '1' },
                { id: 'car2', name: 'Car #7', type: 'car', participantId: '2' },
                { id: 'car3', name: 'Car #11', type: 'car', participantId: '3' },
              ]);
              setSelectedLayout('3x1');
            }}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Leaders (3 cars)
          </button>
          <button
            onClick={() => {
              setActiveCameras([
                { id: 'track', name: 'Track Overview', type: 'track' },
                { id: 'sector1', name: 'Sector 1', type: 'sector', sector: 1 },
                { id: 'sector2', name: 'Sector 2', type: 'sector', sector: 2 },
                { id: 'sector3', name: 'Sector 3', type: 'sector', sector: 3 },
                { id: 'pit', name: 'Pit Lane', type: 'pit' },
                { id: 'start_finish', name: 'Start/Finish', type: 'start_finish' },
              ]);
              setSelectedLayout('3x2');
            }}
            className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Full Track (6 cams)
          </button>
        </div>
      </div>
    </div>
  );
};

// Camera view components
const TrackOverviewCamera: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" rx="40" ry="30" fill="none" stroke="#444" strokeWidth="2" />
        <ellipse cx="50" cy="50" rx="35" ry="25" fill="none" stroke="#666" strokeWidth="1" />
        {/* Car markers */}
        <circle cx="50" cy="20" r="2" fill="#FF0000" />
        <circle cx="80" cy="50" r="2" fill="#00FF00" />
        <circle cx="50" cy="80" r="2" fill="#0000FF" />
        <circle cx="20" cy="50" r="2" fill="#FFFF00" />
      </svg>
    </div>
  );
};

const CarCamera: React.FC<{ participantId?: string }> = ({ participantId }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <div className="text-center text-white">
        <div className="text-4xl mb-2">🏎️</div>
        <div className="text-sm">Car #{participantId}</div>
        <div className="text-xs text-gray-400">Onboard Camera</div>
      </div>
    </div>
  );
};

const PitLaneCamera: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <div className="text-center text-white">
        <div className="text-4xl mb-2">🏁</div>
        <div className="text-sm">Pit Lane</div>
        <div className="text-xs text-gray-400">Pit Camera</div>
      </div>
    </div>
  );
};

const StartFinishCamera: React.FC = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <div className="text-center text-white">
        <div className="text-4xl mb-2">🚦</div>
        <div className="text-sm">Start/Finish</div>
        <div className="text-xs text-gray-400">Finish Line Camera</div>
      </div>
    </div>
  );
};

const SectorCamera: React.FC<{ sector?: number }> = ({ sector }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-800">
      <div className="text-center text-white">
        <div className="text-4xl mb-2">📍</div>
        <div className="text-sm">Sector {sector}</div>
        <div className="text-xs text-gray-400">Sector Camera</div>
      </div>
    </div>
  );
};

const getCameraIcon = (type: string) => {
  switch (type) {
    case 'track': return '🗺️';
    case 'car': return '🏎️';
    case 'pit': return '🏁';
    case 'start_finish': return '🚦';
    case 'sector': return '📍';
    default: return '📷';
  }
};
