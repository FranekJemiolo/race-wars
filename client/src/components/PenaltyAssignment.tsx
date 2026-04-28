/**
 * Penalty Assignment Component
 * 
 * Admin UI for assigning penalties to participants
 */

import React, { useState, useEffect } from 'react';

interface Participant {
  id: string;
  name: string;
  carNumber: string;
  sessionId: string;
}

interface Violation {
  id: string;
  participantId: string;
  type: string;
  severity: string;
  timestamp: number;
  description: string;
}

interface Penalty {
  id: string;
  participantId: string;
  type: 'time' | 'points' | 'grid' | 'disqualification';
  value: number;
  reason: string;
  assignedBy: string;
  assignedAt: number;
}

interface PenaltyAssignmentProps {
  sessionId: string;
  onPenaltyAssigned?: (penalty: Penalty) => void;
}

export const PenaltyAssignment: React.FC<PenaltyAssignmentProps> = ({
  sessionId,
  onPenaltyAssigned,
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>('');
  const [selectedViolation, setSelectedViolation] = useState<string>('');
  const [penaltyType, setPenaltyType] = useState<'time' | 'points' | 'grid' | 'disqualification'>('time');
  const [penaltyValue, setPenaltyValue] = useState<number>(0);
  const [penaltyReason, setPenaltyReason] = useState<string>('');
  const [recentPenalties, setRecentPenalties] = useState<Penalty[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadParticipants();
    loadViolations();
    loadRecentPenalties();
  }, [sessionId]);

  const loadParticipants = async () => {
    try {
      // Mock data - replace with actual API call
      const mockParticipants: Participant[] = [
        { id: '1', name: 'John Doe', carNumber: '42', sessionId },
        { id: '2', name: 'Jane Smith', carNumber: '7', sessionId },
        { id: '3', name: 'Bob Johnson', carNumber: '11', sessionId },
      ];
      setParticipants(mockParticipants);
    } catch (error) {
      console.error('Failed to load participants:', error);
    }
  };

  const loadViolations = async () => {
    try {
      // Mock data - replace with actual API call
      const mockViolations: Violation[] = [
        {
          id: 'v1',
          participantId: '1',
          type: 'speed_zone',
          severity: 'major',
          timestamp: Date.now() - 300000,
          description: 'Speed zone violation - 20km/h over limit',
        },
        {
          id: 'v2',
          participantId: '2',
          type: 'checkpoint_missed',
          severity: 'moderate',
          timestamp: Date.now() - 600000,
          description: 'Missed checkpoint #3',
        },
      ];
      setViolations(mockViolations);
    } catch (error) {
      console.error('Failed to load violations:', error);
    }
  };

  const loadRecentPenalties = async () => {
    try {
      // Mock data - replace with actual API call
      const mockPenalties: Penalty[] = [
        {
          id: 'p1',
          participantId: '1',
          type: 'time',
          value: 30,
          reason: 'Speed zone violation',
          assignedBy: 'admin',
          assignedAt: Date.now() - 900000,
        },
      ];
      setRecentPenalties(mockPenalties);
    } catch (error) {
      console.error('Failed to load penalties:', error);
    }
  };

  const handleAssignPenalty = async () => {
    if (!selectedParticipant || !penaltyReason) {
      alert('Please select a participant and provide a reason');
      return;
    }

    setIsLoading(true);

    try {
      const newPenalty: Penalty = {
        id: `p${Date.now()}`,
        participantId: selectedParticipant,
        type: penaltyType,
        value: penaltyValue,
        reason: penaltyReason,
        assignedBy: 'admin',
        assignedAt: Date.now(),
      };

      // Replace with actual API call
      console.log('Assigning penalty:', newPenalty);

      setRecentPenalties([newPenalty, ...recentPenalties]);
      
      if (onPenaltyAssigned) {
        onPenaltyAssigned(newPenalty);
      }

      // Reset form
      setSelectedParticipant('');
      setSelectedViolation('');
      setPenaltyType('time');
      setPenaltyValue(0);
      setPenaltyReason('');
    } catch (error) {
      console.error('Failed to assign penalty:', error);
      alert('Failed to assign penalty');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPenalty = (participantId: string, violationId: string) => {
    setSelectedParticipant(participantId);
    setSelectedViolation(violationId);
    
    const violation = violations.find(v => v.id === violationId);
    if (violation) {
      setPenaltyReason(violation.description);
      
      // Auto-set penalty based on severity
      switch (violation.severity) {
        case 'minor':
          setPenaltyType('time');
          setPenaltyValue(10);
          break;
        case 'moderate':
          setPenaltyType('time');
          setPenaltyValue(30);
          break;
        case 'major':
          setPenaltyType('time');
          setPenaltyValue(60);
          break;
        case 'critical':
          setPenaltyType('disqualification');
          setPenaltyValue(0);
          break;
      }
    }
  };

  const getPenaltyTypeLabel = (type: string) => {
    switch (type) {
      case 'time': return 'Time Penalty (seconds)';
      case 'points': return 'Points Penalty';
      case 'grid': return 'Grid Penalty (positions)';
      case 'disqualification': return 'Disqualification';
      default: return type;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor': return 'text-yellow-600 bg-yellow-100';
      case 'moderate': return 'text-orange-600 bg-orange-100';
      case 'major': return 'text-red-600 bg-red-100';
      case 'critical': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Penalty Assignment</h2>

      {/* Recent Penalties */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Recent Penalties</h3>
        {recentPenalties.length === 0 ? (
          <p className="text-gray-500 italic">No penalties assigned yet</p>
        ) : (
          <div className="space-y-2">
            {recentPenalties.map((penalty) => {
              const participant = participants.find(p => p.id === penalty.participantId);
              return (
                <div key={penalty.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{participant?.name || 'Unknown'}</span>
                    <span className="text-gray-500 mx-2">-</span>
                    <span className="text-sm">{getPenaltyTypeLabel(penalty.type)}</span>
                    {penalty.type !== 'disqualification' && (
                      <span className="font-bold ml-2">{penalty.value}</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(penalty.assignedAt).toLocaleTimeString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Active Violations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Active Violations</h3>
        {violations.length === 0 ? (
          <p className="text-gray-500 italic">No active violations</p>
        ) : (
          <div className="space-y-2">
            {violations.map((violation) => {
              const participant = participants.find(p => p.id === violation.participantId);
              return (
                <div key={violation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{participant?.name || 'Unknown'}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(violation.severity)}`}>
                        {violation.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{violation.description}</p>
                  </div>
                  <button
                    onClick={() => handleQuickPenalty(violation.participantId, violation.id)}
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                  >
                    Assign Penalty
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Penalty Assignment Form */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Assign New Penalty</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Participant Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Participant
            </label>
            <select
              value={selectedParticipant}
              onChange={(e) => setSelectedParticipant(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select participant...</option>
              {participants.map((participant) => (
                <option key={participant.id} value={participant.id}>
                  #{participant.carNumber} - {participant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Penalty Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty Type
            </label>
            <select
              value={penaltyType}
              onChange={(e) => setPenaltyType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="time">Time Penalty</option>
              <option value="points">Points Penalty</option>
              <option value="grid">Grid Penalty</option>
              <option value="disqualification">Disqualification</option>
            </select>
          </div>

          {/* Penalty Value */}
          {penaltyType !== 'disqualification' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                type="number"
                value={penaltyValue}
                onChange={(e) => setPenaltyValue(parseInt(e.target.value) || 0)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={penaltyType === 'time' ? 'Seconds' : penaltyType === 'points' ? 'Points' : 'Positions'}
              />
            </div>
          )}

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <textarea
              value={penaltyReason}
              onChange={(e) => setPenaltyReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the reason for this penalty..."
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAssignPenalty}
            disabled={isLoading || !selectedParticipant || !penaltyReason}
            className="px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Assigning...' : 'Assign Penalty'}
          </button>
        </div>
      </div>
    </div>
  );
};
