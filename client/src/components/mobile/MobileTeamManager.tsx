import React, { useState, useEffect } from 'react';
import { getTeamRacingService, Team, TeamInvitation, TeamRole, TeamSettings } from '../../services/teamRacing.service';

interface MobileTeamManagerProps {
  userId: string;
  className?: string;
}

export const MobileTeamManager: React.FC<MobileTeamManagerProps> = ({ userId, className = '' }) => {
  const teamsService = getTeamRacingService();
  
  const [activeTab, setActiveTab] = useState<'teams' | 'create' | 'invitations' | 'leaderboard'>('teams');
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
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
    allowInvites: true
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    loadUserTeams();
    loadInvitations();
    
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

  const handleCreateTeam = async () => {
    // Validate form
    const nameValidation = teamsService.validateTeamName(formData.name);
    const tagValidation = teamsService.validateTeamTag(formData.tag);
    
    const allErrors = [...nameValidation.errors, ...tagValidation.errors];
    setValidationErrors(allErrors);

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
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: formData.color,
        emblemStyle: 'modern'
      };

      await teamsService.createTeam({
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
        allowInvites: true
      });
      
      setValidationErrors([]);
      setShowCreateForm(false);
      loadUserTeams();
      setActiveTab('teams');
      
      alert('Team created successfully!');
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      const joined = await teamsService.joinTeam(teamId, userId);
      if (joined) {
        loadUserTeams();
        alert('Successfully joined the team!');
      } else {
        alert('Failed to join team');
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

  const TeamCard: React.FC<{ team: Team }> = ({ team }) => (
    <div className="bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ backgroundColor: team.color }}
          >
            {team.tag}
          </div>
          <div>
            <h3 className="font-semibold">{team.name}</h3>
            <p className="text-xs text-gray-400">#{team.ranking > 0 ? team.ranking : 'Unranked'}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-lg font-bold">{team.wins}W</div>
          <div className="text-xs text-gray-400">{team.losses}L</div>
        </div>
      </div>

      <p className="text-gray-300 text-sm mb-3 line-clamp-2">{team.description}</p>

      <div className="grid grid-cols-3 gap-2 text-xs mb-3">
        <div className="text-center">
          <div className="font-semibold">{team.currentMembers}/{team.maxMembers}</div>
          <div className="text-gray-400">Members</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{Math.round(team.averageRating)}</div>
          <div className="text-gray-400">Rating</div>
        </div>
        <div className="text-center">
          <div className="font-semibold">{(team.winRate * 100).toFixed(0)}%</div>
          <div className="text-gray-400">Win Rate</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleViewTeam(team)}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm touch-manipulation"
        >
          View
        </button>
        <button
          onClick={() => handleLeaveTeam(team.id)}
          className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded text-sm touch-manipulation"
        >
          Leave
        </button>
      </div>
    </div>
  );

  const InvitationCard: React.FC<{ invitation: TeamInvitation }> = ({ invitation }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h4 className="font-semibold text-sm">{invitation.inviteeName}</h4>
          <p className="text-xs text-gray-400">
            From {invitation.inviterName} • {formatTime(invitation.sentAt)}
          </p>
        </div>
        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
      </div>

      {invitation.message && (
        <p className="text-gray-300 text-xs mb-3">{invitation.message}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleAcceptInvitation(invitation.id)}
          className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-xs touch-manipulation"
        >
          Accept
        </button>
        <button
          onClick={() => handleDeclineInvitation(invitation.id)}
          className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded text-xs touch-manipulation"
        >
          Decline
        </button>
      </div>
    </div>
  );

  return (
    <div className={`mobile-team-manager bg-gray-900 text-white min-h-screen ${className}`}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-lg font-bold">Teams</h1>
            <p className="text-xs text-gray-400">Manage your racing teams</p>
          </div>
          
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-blue-600 rounded text-xs">
              {userTeams.length}
            </span>
            {invitations.length > 0 && (
              <span className="px-2 py-1 bg-yellow-600 rounded text-xs">
                {invitations.length}
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t border-gray-700">
          {['teams', 'create', 'invitations', 'leaderboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 text-xs font-medium capitalize touch-manipulation ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {activeTab === 'teams' && (
          <div className="space-y-4">
            {userTeams.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🏁</div>
                <p className="text-gray-400 text-sm mb-4">No teams yet</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm touch-manipulation"
                >
                  Create Team
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userTeams.map((team) => (
                  <TeamCard key={team.id} team={team} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'create' && (
          <div className="space-y-4">
            {!showCreateForm ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-400 text-sm mb-4">Create your own racing team</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm touch-manipulation"
                >
                  Create New Team
                </button>
              </div>
            ) : (
              <div className="bg-gray-800 rounded-xl p-4 space-y-4">
                <h3 className="font-semibold text-lg">Create Team</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Team Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter team name..."
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Team Tag</label>
                    <input
                      type="text"
                      value={formData.tag}
                      onChange={(e) => setFormData({...formData, tag: e.target.value.toUpperCase()})}
                      placeholder="TAG"
                      maxLength={4}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your team..."
                      rows={3}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white placeholder-gray-400 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Team Color</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({...formData, color: e.target.value})}
                      className="w-full h-10 bg-gray-700 rounded-lg cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Max Members</label>
                    <select
                      value={formData.maxMembers}
                      onChange={(e) => setFormData({...formData, maxMembers: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 bg-gray-700 rounded-lg text-white text-sm"
                    >
                      <option value={4}>4 Members</option>
                      <option value={6}>6 Members</option>
                      <option value={8}>8 Members</option>
                      <option value={10}>10 Members</option>
                      <option value={12}>12 Members</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Public team</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.requireApproval}
                        onChange={(e) => setFormData({...formData, requireApproval: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Require approval</span>
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.allowInvites}
                        onChange={(e) => setFormData({...formData, allowInvites: e.target.checked})}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Allow invites</span>
                    </label>
                  </div>

                  {/* Validation Errors */}
                  {validationErrors.length > 0 && (
                    <div className="p-3 bg-red-900 rounded-lg">
                      <h4 className="font-semibold text-red-300 text-sm mb-2">Errors:</h4>
                      <ul className="text-xs text-red-200 space-y-1">
                        {validationErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleCreateTeam}
                    disabled={isCreating || validationErrors.length > 0}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium disabled:opacity-50 touch-manipulation"
                  >
                    {isCreating ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(false);
                      setValidationErrors([]);
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium touch-manipulation"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Invitations</h3>
            
            {invitations.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-4">📬</div>
                <p className="text-gray-400 text-sm">No pending invitations</p>
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

        {activeTab === 'leaderboard' && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Team Rankings</h3>
            
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-400 text-sm">Leaderboard coming soon</p>
            </div>
          </div>
        )}
      </div>

      {/* Team Details Modal */}
      {showTeamDetails && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-4 max-w-sm w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">{selectedTeam.name}</h3>
              <button
                onClick={() => setShowTeamDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: selectedTeam.color }}
                >
                  {selectedTeam.tag}
                </div>
                <div>
                  <p className="text-gray-300 text-sm">{selectedTeam.description}</p>
                  <div className="flex gap-1 mt-1">
                    {selectedTeam.isPublic ? (
                      <span className="px-1 py-0.5 bg-green-600 rounded text-xs">Public</span>
                    ) : (
                      <span className="px-1 py-0.5 bg-gray-600 rounded text-xs">Private</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-700 rounded p-2 text-center">
                  <div className="font-bold">{selectedTeam.currentMembers}/{selectedTeam.maxMembers}</div>
                  <div className="text-xs text-gray-400">Members</div>
                </div>
                <div className="bg-gray-700 rounded p-2 text-center">
                  <div className="font-bold">{Math.round(selectedTeam.averageRating)}</div>
                  <div className="text-xs text-gray-400">Rating</div>
                </div>
                <div className="bg-gray-700 rounded p-2 text-center">
                  <div className="font-bold">{(selectedTeam.winRate * 100).toFixed(0)}%</div>
                  <div className="text-xs text-gray-400">Win Rate</div>
                </div>
                <div className="bg-gray-700 rounded p-2 text-center">
                  <div className="font-bold">#{selectedTeam.ranking}</div>
                  <div className="text-xs text-gray-400">Ranking</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">Members</h4>
                <div className="space-y-2">
                  {selectedTeam.members.slice(0, 3).map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-xs">
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{member.username}</p>
                          <p className="text-xs text-gray-400">{Math.round(member.rating)}</p>
                        </div>
                      </div>
                      <span className={`px-1 py-0.5 rounded text-xs ${getRoleColor(member.role)}`}>
                        {getRoleName(member.role)}
                      </span>
                    </div>
                  ))}
                  {selectedTeam.members.length > 3 && (
                    <p className="text-xs text-gray-400 text-center">
                      +{selectedTeam.members.length - 3} more members
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowTeamDetails(false)}
                  className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm touch-manipulation"
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
