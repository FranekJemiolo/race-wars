import React, { useState, useEffect } from 'react';
import { getTeamRacingService, Team, TeamInvitation, TeamRole, TeamSettings } from '../services/teamRacing.service';

interface TeamManagerProps {
  userId: string;
  className?: string;
}

export const TeamManager: React.FC<TeamManagerProps> = ({ userId, className = '' }) => {
  const teamsService = getTeamRacingService();
  
  const [activeTab, setActiveTab] = useState<'teams' | 'create' | 'invitations' | 'discover'>('teams');
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [recommendedTeams, setRecommendedTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'public' | 'private'>('all');
  
  // Form state for creating team
  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    description: '',
    color: '#3B82F6',
    isPublic: true,
    maxMembers: 8,
    minRating: 0,
    requireApproval: false,
    allowInvites: true,
    teamChat: true,
    voiceChat: false
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  useEffect(() => {
    loadUserTeams();
    loadInvitations();
    loadRecommendedTeams();
    
    // Subscribe to team events
    const unsubscribe = teamsService.subscribeToUserTeamEvents(userId, (event) => {
      loadUserTeams();
      loadInvitations();
    });
    
    return unsubscribe;
  }, [userId]);

  const loadUserTeams = async () => {
    try {
      const teams = await teamsService.getUserTeams(userId);
      setUserTeams(teams);
    } catch (error) {
      console.error('Failed to load user teams:', error);
    }
  };

  const loadInvitations = async () => {
    try {
      const pendingInvitations = await teamsService.getPendingInvitations(userId);
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const loadRecommendedTeams = async () => {
    try {
      const recommended = await teamsService.getRecommendedTeams(userId);
      setRecommendedTeams(recommended);
    } catch (error) {
      console.error('Failed to load recommended teams:', error);
    }
  };

  const handleCreateTeam = async () => {
    // Validate form
    const nameValidation = teamsService.validateTeamName(formData.name);
    const tagValidation = teamsService.validateTeamTag(formData.tag);
    const settingsValidation = teamsService.validateTeamSettings({
      maxMembers: formData.maxMembers,
      minRating: formData.minRating,
      requireApproval: formData.requireApproval,
      allowInvites: formData.allowInvites,
      teamChat: formData.teamChat,
      voiceChat: formData.voiceChat,
      privateRaces: false,
      autoAcceptInvites: false,
      teamColor: formData.color,
      emblemStyle: 'modern'
    });

    const allErrors = [...nameValidation.errors, ...tagValidation.errors, ...settingsValidation.errors];
    const allWarnings = [...nameValidation.warnings, ...tagValidation.warnings, ...settingsValidation.warnings];

    setValidationErrors(allErrors);
    setValidationWarnings(allWarnings);

    if (allErrors.length > 0) {
      return;
    }

    setIsCreating(true);
    
    try {
      const teamSettings: TeamSettings = {
        allowInvites: formData.allowInvites,
        requireApproval: formData.requireApproval,
        minRating: formData.minRating,
        maxMembers: formData.maxMembers,
        teamChat: formData.teamChat,
        voiceChat: formData.voiceChat,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: formData.color,
        emblemStyle: 'modern'
      };

      const newTeam = await teamsService.createTeam({
        name: formData.name,
        tag: formData.tag.toUpperCase(),
        description: formData.description,
        color: formData.color,
        createdBy: userId,
        isActive: true,
        isPublic: formData.isPublic,
        maxMembers: formData.maxMembers,
        currentMembers: 1,
        memberCount: 1,
        averageRating: 1500,
        totalRaces: 0,
        wins: 0,
        losses: 0,
        points: 0,
        ranking: 0,
        achievements: [],
        settings: teamSettings,
        stats: {
          totalRaces: 0,
          totalWins: 0,
          totalLosses: 0,
          totalPoints: 0,
          averagePosition: 0,
          bestPosition: 0,
          winRate: 0,
          averageTeamScore: 0,
          bestTeamScore: 0,
          totalDistance: 0,
          totalDuration: 0,
          memberContributions: {},
          performance: {
            recentForm: [],
            momentum: 0,
            consistency: 0,
            improvement: 0,
            streak: 0,
            peakPerformance: 0
          }
        },
        members: [],
        invitations: [],
        raceHistory: []
      });

      // Reset form
      setFormData({
        name: '',
        tag: '',
        description: '',
        color: '#3B82F6',
        isPublic: true,
        maxMembers: 8,
        minRating: 0,
        requireApproval: false,
        allowInvites: true,
        teamChat: true,
        voiceChat: false
      });
      
      setValidationErrors([]);
      setValidationWarnings([]);
      
      loadUserTeams();
      setActiveTab('teams');
      
      alert('Team created successfully!');
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      const joined = await teamsService.joinTeam(teamId, userId);
      if (joined) {
        loadUserTeams();
        loadRecommendedTeams();
        alert('Successfully joined the team!');
      } else {
        alert('Failed to join team. You may not meet the requirements.');
      }
    } catch (error) {
      console.error('Failed to join team:', error);
      alert('Failed to join team');
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!confirm('Are you sure you want to leave this team?')) return;
    
    try {
      const left = await teamsService.leaveTeam(teamId, userId);
      if (left) {
        loadUserTeams();
        alert('Successfully left the team');
      } else {
        alert('Failed to leave team');
      }
    } catch (error) {
      console.error('Failed to leave team:', error);
      alert('Failed to leave team');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const accepted = await teamsService.acceptInvitation(invitationId, userId);
      if (accepted) {
        loadUserTeams();
        loadInvitations();
        alert('Successfully joined the team!');
      } else {
        alert('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      alert('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const declined = await teamsService.declineInvitation(invitationId, userId);
      if (declined) {
        loadInvitations();
        alert('Invitation declined');
      } else {
        alert('Failed to decline invitation');
      }
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      alert('Failed to decline invitation');
    }
  };

  const handleViewTeam = (team: Team) => {
    setSelectedTeam(team);
    setShowTeamDetails(true);
  };

  const getRoleColor = (role: TeamRole): string => {
    switch (role) {
      case 'leader': return 'bg-purple-600';
      case 'co_leader': return 'bg-blue-600';
      case 'captain': return 'bg-green-600';
      case 'member': return 'bg-gray-600';
      case 'recruit': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getRoleName = (role: TeamRole): string => {
    switch (role) {
      case 'leader': return 'Leader';
      case 'co_leader': return 'Co-Leader';
      case 'captain': return 'Captain';
      case 'member': return 'Member';
      case 'recruit': return 'Recruit';
      default: return 'Member';
    }
  };

  const formatTime = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const TeamCard: React.FC<{ team: Team; showJoinButton?: boolean }> = ({ team, showJoinButton = false }) => (
    <div className="bg-gray-800 rounded-xl p-6 cursor-pointer hover:bg-gray-700 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: team.color }}
          >
            {team.tag}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{team.name}</h3>
            <p className="text-sm text-gray-400">Created {formatTime(team.createdAt)}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold" style={{ color: team.color }}>
            {team.ranking > 0 ? `#${team.ranking}` : 'Unranked'}
          </div>
          <p className="text-xs text-gray-400">Ranking</p>
        </div>
      </div>

      <p className="text-gray-300 mb-4 line-clamp-2">{team.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-400">Members:</span>
          <span className="ml-2 font-medium">{team.currentMembers}/{team.maxMembers}</span>
        </div>
        <div>
          <span className="text-gray-400">Rating:</span>
          <span className="ml-2 font-medium">{Math.round(team.averageRating)}</span>
        </div>
        <div>
          <span className="text-gray-400">Win Rate:</span>
          <span className="ml-2 font-medium">{(team.winRate * 100).toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-gray-400">Races:</span>
          <span className="ml-2 font-medium">{team.totalRaces}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {team.isPublic ? (
            <span className="px-2 py-1 bg-green-600 rounded text-xs">Public</span>
          ) : (
            <span className="px-2 py-1 bg-gray-600 rounded text-xs">Private</span>
          )}
          {team.isActive && (
            <span className="px-2 py-1 bg-blue-600 rounded text-xs">Active</span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleViewTeam(team)}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm touch-manipulation"
          >
            View
          </button>
          {showJoinButton && (
            <button
              onClick={() => handleJoinTeam(team.id)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation"
            >
              Join
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const InvitationCard: React.FC<{ invitation: TeamInvitation }> = ({ invitation }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-semibold">{invitation.inviteeName}</h4>
          <p className="text-sm text-gray-400">
            Invited by {invitation.inviterName} • {formatTime(invitation.sentAt)}
          </p>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${
          invitation.status === 'pending' ? 'bg-yellow-600' : 'bg-gray-600'
        }`}>
          {invitation.status}
        </span>
      </div>

      {invitation.message && (
        <p className="text-gray-300 text-sm mb-3">{invitation.message}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleAcceptInvitation(invitation.id)}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-sm touch-manipulation"
        >
          Accept
        </button>
        <button
          onClick={() => handleDeclineInvitation(invitation.id)}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded text-sm touch-manipulation"
        >
          Decline
        </button>
      </div>
    </div>
  );

  return (
    <div className={`team-manager bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Team Management</h1>
            <p className="text-gray-400">Create and manage your racing teams</p>
          </div>
          
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-blue-600 rounded-lg text-sm">
              {userTeams.length} Teams
            </span>
            <span className="px-3 py-1 bg-yellow-600 rounded-lg text-sm">
              {invitations.length} Invitations
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-6 border-b border-gray-600">
          {['teams', 'create', 'invitations', 'discover'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'teams' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">My Teams</h2>
            
            {userTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏁</div>
                <p className="text-gray-400 mb-4">You haven't joined any teams yet</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg touch-manipulation"
                >
                  Discover Teams
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userTeams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold mb-4">Create New Team</h2>
            
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Team Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter team name..."
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team Tag (2-4 chars)</label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => setFormData({...formData, tag: e.target.value.toUpperCase()})}
                    placeholder="TEAM"
                    maxLength={4}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your team..."
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Team Color</label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full h-10 bg-gray-700 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Max Members</label>
                  <select
                    value={formData.maxMembers}
                    onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white"
                  >
                    <option value={4}>4 Members</option>
                    <option value={6}>6 Members</option>
                    <option value={8}>8 Members</option>
                    <option value={10}>10 Members</option>
                    <option value={12}>12 Members</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Minimum Rating</label>
                  <input
                    type="number"
                    value={formData.minRating}
                    onChange={(e) => setFormData({...formData, minRating: parseInt(e.target.value)})}
                    placeholder="0"
                    min="0"
                    max="3000"
                    className="w-full px-4 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400"
                  />
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Public team (anyone can join)</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.requireApproval}
                      onChange={(e) => setFormData({...formData, requireApproval: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Require approval for new members</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allowInvites}
                      onChange={(e) => setFormData({...formData, allowInvites: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Allow member invitations</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.teamChat}
                      onChange={(e) => setFormData({...formData, teamChat: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable team chat</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.voiceChat}
                      onChange={(e) => setFormData({...formData, voiceChat: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enable voice chat</span>
                  </label>
                </div>
              </div>

              {/* Validation Messages */}
              {validationErrors.length > 0 && (
                <div className="mt-4 p-3 bg-red-900 rounded-lg">
                  <h4 className="font-semibold text-red-300 mb-2">Please fix these errors:</h4>
                  <ul className="text-sm text-red-200 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validationWarnings.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-900 rounded-lg">
                  <h4 className="font-semibold text-yellow-300 mb-2">Warnings:</h4>
                  <ul className="text-sm text-yellow-200 space-y-1">
                    {validationWarnings.map((warning, index) => (
                      <li key={index}>• {warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateTeam}
                  disabled={isCreating || validationErrors.length > 0}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 touch-manipulation"
                >
                  {isCreating ? 'Creating...' : 'Create Team'}
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
            
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📬</div>
                <p className="text-gray-400">No pending invitations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <InvitationCard key={invitation.id} invitation={invitation} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'discover' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Discover Teams</h2>
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-gray-800 rounded-lg text-white placeholder-gray-400"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('all')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filterType === 'all' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('public')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filterType === 'public' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                Public
              </button>
              <button
                onClick={() => setFilterType('private')}
                className={`px-4 py-2 rounded-lg text-sm ${
                  filterType === 'private' ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                Private
              </button>
            </div>

            {/* Recommended Teams */}
            {recommendedTeams.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Recommended for You</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendedTeams.map((team) => (
                    <TeamCard key={team.id} team={team} showJoinButton={true} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedTeam.name}</h3>
              <button
                onClick={() => setShowTeamDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: selectedTeam.color }}
                >
                  {selectedTeam.tag}
                </div>
                <div>
                  <p className="text-gray-300">{selectedTeam.description}</p>
                  <div className="flex gap-2 mt-2">
                    {selectedTeam.isPublic ? (
                      <span className="px-2 py-1 bg-green-600 rounded text-xs">Public</span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-600 rounded text-xs">Private</span>
                    )}
                    <span className="px-2 py-1 bg-blue-600 rounded text-xs">
                      {selectedTeam.currentMembers}/{selectedTeam.maxMembers} Members
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Rating:</span>
                  <span className="ml-2 font-medium">{Math.round(selectedTeam.averageRating)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Win Rate:</span>
                  <span className="ml-2 font-medium">{(selectedTeam.winRate * 100).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Total Races:</span>
                  <span className="ml-2 font-medium">{selectedTeam.totalRaces}</span>
                </div>
                <div>
                  <span className="text-gray-400">Ranking:</span>
                  <span className="ml-2 font-medium">#{selectedTeam.ranking}</span>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Team Members</h4>
                <div className="space-y-2">
                  {selectedTeam.members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{member.username}</p>
                          <p className="text-xs text-gray-400">Rating: {Math.round(member.rating)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getRoleColor(member.role)}`}>
                        {getRoleName(member.role)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleJoinTeam(selectedTeam.id)}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium touch-manipulation"
                >
                  Join Team
                </button>
                <button
                  onClick={() => setShowTeamDetails(false)}
                  className="px-6 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium touch-manipulation"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
