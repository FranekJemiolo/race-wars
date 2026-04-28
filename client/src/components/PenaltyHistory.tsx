/**
 * Penalty History Component
 * 
 * Displays penalty history for participants with filtering and search
 */

import React, { useState, useEffect } from 'react';

interface Penalty {
  id: string;
  participantId: string;
  participantName: string;
  carNumber: string;
  type: 'time' | 'points' | 'grid' | 'disqualification';
  value: number;
  reason: string;
  assignedBy: string;
  assignedAt: number;
  sessionId: string;
  status: 'active' | 'appealed' | 'upheld' | 'reduced' | 'void';
}

interface PenaltyHistoryProps {
  sessionId: string;
  participantId?: string;
}

export const PenaltyHistory: React.FC<PenaltyHistoryProps> = ({
  sessionId,
  participantId,
}) => {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [filteredPenalties, setFilteredPenalties] = useState<Penalty[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPenalties();
  }, [sessionId, participantId]);

  useEffect(() => {
    applyFilters();
  }, [penalties, filterType, filterStatus, searchTerm]);

  const loadPenalties = async () => {
    setIsLoading(true);
    try {
      // Mock data - replace with actual API call
      const mockPenalties: Penalty[] = [
        {
          id: 'p1',
          participantId: '1',
          participantName: 'John Doe',
          carNumber: '42',
          type: 'time',
          value: 30,
          reason: 'Speed zone violation',
          assignedBy: 'admin',
          assignedAt: Date.now() - 900000,
          sessionId,
          status: 'active',
        },
        {
          id: 'p2',
          participantId: '2',
          participantName: 'Jane Smith',
          carNumber: '7',
          type: 'points',
          value: 5,
          reason: 'Blue flag violation',
          assignedBy: 'admin',
          assignedAt: Date.now() - 1800000,
          sessionId,
          status: 'active',
        },
        {
          id: 'p3',
          participantId: '3',
          participantName: 'Bob Johnson',
          carNumber: '11',
          type: 'grid',
          value: 3,
          reason: 'Jumped start',
          assignedBy: 'admin',
          assignedAt: Date.now() - 3600000,
          sessionId,
          status: 'upheld',
        },
      ];

      setPenalties(mockPenalties);
    } catch (error) {
      console.error('Failed to load penalties:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...penalties];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(p => p.type === filterType);
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.participantName.toLowerCase().includes(term) ||
        p.carNumber.toLowerCase().includes(term) ||
        p.reason.toLowerCase().includes(term)
      );
    }

    setFilteredPenalties(filtered);
  };

  const handleAppeal = (penaltyId: string) => {
    // Implement appeal logic
    console.log('Appealing penalty:', penaltyId);
  };

  const getPenaltyTypeLabel = (type: string) => {
    switch (type) {
      case 'time': return 'Time';
      case 'points': return 'Points';
      case 'grid': return 'Grid';
      case 'disqualification': return 'DSQ';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'appealed': return 'bg-yellow-100 text-yellow-800';
      case 'upheld': return 'bg-green-100 text-green-800';
      case 'reduced': return 'bg-orange-100 text-orange-800';
      case 'void': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'time': return 'bg-purple-100 text-purple-800';
      case 'points': return 'bg-indigo-100 text-indigo-800';
      case 'grid': return 'bg-pink-100 text-pink-800';
      case 'disqualification': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading penalties...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">Penalty History</h2>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Penalty Type
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            <option value="time">Time Penalty</option>
            <option value="points">Points Penalty</option>
            <option value="grid">Grid Penalty</option>
            <option value="disqualification">Disqualification</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="appealed">Appealed</option>
            <option value="upheld">Upheld</option>
            <option value="reduced">Reduced</option>
            <option value="void">Void</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, car number, or reason..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Penalty List */}
      {filteredPenalties.length === 0 ? (
        <p className="text-gray-500 italic">No penalties found</p>
      ) : (
        <div className="space-y-3">
          {filteredPenalties.map((penalty) => (
            <div key={penalty.id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-lg">#{penalty.carNumber}</span>
                    <span className="text-gray-600">{penalty.participantName}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(penalty.type)}`}>
                      {getPenaltyTypeLabel(penalty.type)}
                    </span>
                    {penalty.type !== 'disqualification' && (
                      <span className="font-bold">{penalty.value}</span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(penalty.status)}`}>
                      {penalty.status}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{penalty.reason}</p>
                  <div className="text-sm text-gray-500">
                    <span>Assigned by {penalty.assignedBy}</span>
                    <span className="mx-2">•</span>
                    <span>{new Date(penalty.assignedAt).toLocaleString()}</span>
                  </div>
                </div>
                {penalty.status === 'active' && (
                  <button
                    onClick={() => handleAppeal(penalty.id)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
                  >
                    Appeal
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t">
        <h3 className="text-lg font-semibold mb-3">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-2xl font-bold">{penalties.length}</div>
            <div className="text-sm text-gray-600">Total Penalties</div>
          </div>
          <div className="bg-blue-50 p-3 rounded">
            <div className="text-2xl font-bold">{penalties.filter(p => p.status === 'active').length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-2xl font-bold">{penalties.filter(p => p.status === 'appealed').length}</div>
            <div className="text-sm text-gray-600">Appealed</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-2xl font-bold">{penalties.filter(p => p.status === 'upheld').length}</div>
            <div className="text-sm text-gray-600">Upheld</div>
          </div>
        </div>
      </div>
    </div>
  );
};
