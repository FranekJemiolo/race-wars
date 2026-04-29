/**
 * Team Racing Service
 * 
 * Manages team-based racing, team creation, joining, management, and team leaderboards
 * Provides comprehensive team functionality for collaborative racing experiences
 */

export interface Team {
  id: string;
  name: string;
  tag: string; // 3-4 character team tag
  description: string;
  logo?: string;
  color: string; // Team color for UI
  createdBy: string;
  createdAt: number;
  isActive: boolean;
  isPublic: boolean;
  maxMembers: number;
  currentMembers: number;
  memberCount: number;
  averageRating: number;
  totalRaces: number;
  wins: number;
  losses: number;
  points: number;
  ranking: number;
  achievements: TeamAchievement[];
  settings: TeamSettings;
  stats: TeamStats;
  members: TeamMember[];
  invitations: TeamInvitation[];
  raceHistory: TeamRaceResult[];
}

export interface TeamMember {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  role: TeamRole;
  joinedAt: number;
  isActive: boolean;
  rating: number;
  races: number;
  wins: number;
  points: number;
  contribution: number; // Team contribution score
  status: MemberStatus;
  lastActive: number;
  achievements: string[];
  stats: MemberStats;
}

export interface TeamInvitation {
  id: string;
  teamId: string;
  inviterId: string;
  inviterName: string;
  inviteeId: string;
  inviteeName: string;
  message?: string;
  status: InvitationStatus;
  sentAt: number;
  expiresAt: number;
  role: TeamRole;
}

export interface TeamRaceResult {
  id: string;
  raceId: string;
  raceName: string;
  date: number;
  position: number;
  points: number;
  participants: string[];
  totalTeams: number;
  duration: number;
  bestLap: number;
  averagePosition: number;
  teamScore: number;
  opponentTeam?: string;
  result: RaceResult;
}

export interface TeamAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number;
  rarity: AchievementRarity;
  points: number;
  progress?: number;
  maxProgress?: number;
}

export interface TeamSettings {
  allowInvites: boolean;
  requireApproval: boolean;
  minRating: number;
  maxMembers: number;
  teamChat: boolean;
  voiceChat: boolean;
  privateRaces: boolean;
  autoAcceptInvites: boolean;
  teamColor: string;
  emblemStyle: EmblemStyle;
}

export interface TeamStats {
  totalRaces: number;
  totalWins: number;
  totalLosses: number;
  totalPoints: number;
  averagePosition: number;
  bestPosition: number;
  winRate: number;
  averageTeamScore: number;
  bestTeamScore: number;
  totalDistance: number;
  totalDuration: number;
  memberContributions: Record<string, number>;
  performance: TeamPerformance;
}

export interface MemberStats {
  individualRaces: number;
  teamRaces: number;
  individualWins: number;
  teamWins: number;
  averagePosition: number;
  bestPosition: number;
  contributionScore: number;
  reliability: number; // Attendance/reliability score
  teamwork: number; // Teamwork performance score
  communication: number; // Communication score
}

export interface TeamPerformance {
  recentForm: number[]; // Last 10 race positions
  momentum: number; // Current momentum (-100 to +100)
  consistency: number; // Consistency score (0-100)
  improvement: number; // Improvement rate
  streak: number; // Current win/loss streak
  peakPerformance: number; // Best performance period
}

export interface TeamLeaderboard {
  teams: TeamLeaderboardEntry[];
  totalTeams: number;
  lastUpdated: number;
  competitionType: CompetitionType;
  timeRange: TimeRange;
}

export interface TeamLeaderboardEntry {
  rank: number;
  team: Team;
  points: number;
  races: number;
  wins: number;
  losses: number;
  winRate: number;
  averagePosition: number;
  form: number;
  change: number; // Rank change from previous update
  streak: number;
  bestStreak: number;
}

export interface TeamCompetition {
  id: string;
  name: string;
  description: string;
  type: CompetitionType;
  format: CompetitionFormat;
  maxTeams: number;
  currentTeams: number;
  entryFee?: number;
  prizePool?: number;
  startDate: number;
  endDate: number;
  status: CompetitionStatus;
  rules: CompetitionRules;
  leaderboard: TeamLeaderboard;
  schedule: CompetitionSchedule[];
  rewards: CompetitionReward[];
}

export interface TeamChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  type: MessageType;
  replyTo?: string;
  reactions: MessageReaction[];
  isEdited: boolean;
  editedAt?: number;
}

export interface MessageReaction {
  emoji: string;
  users: string[];
  count: number;
}

export type TeamRole = 'leader' | 'co_leader' | 'captain' | 'member' | 'recruit';
export type MemberStatus = 'active' | 'inactive' | 'away' | 'racing' | 'offline';
export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
export type RaceResult = 'win' | 'loss' | 'dnf' | 'dsq';
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type EmblemStyle = 'classic' | 'modern' | 'minimal' | 'bold' | 'elegant';
export type CompetitionType = 'seasonal' | 'tournament' | 'championship' | 'friendly' | 'ranked';
export type CompetitionFormat = 'round_robin' | 'elimination' | 'swiss' | 'league' | 'knockout';
export type CompetitionStatus = 'upcoming' | 'registration' | 'active' | 'completed' | 'cancelled';
export type MessageType = 'text' | 'system' | 'achievement' | 'race_invite' | 'announcement';
export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'seasonal' | 'all_time';

export interface CompetitionRules {
  teamSize: number;
  minTeams: number;
  maxTeams: number;
  raceFormat: string;
  scoringSystem: ScoringSystem;
  tieBreaker: TieBreaker;
  restrictions: CompetitionRestriction[];
}

export interface ScoringSystem {
  positionPoints: Record<number, number>;
  bonusPoints: {
    fastestLap: number;
    polePosition: number;
    mostLapsLed: number;
    teamBonus: number;
  };
  penalties: {
    dnf: number;
    dsq: number;
    lateEntry: number;
  };
}

export interface TieBreaker {
  primary: 'points' | 'wins' | 'average_position' | 'best_position';
  secondary: 'points' | 'wins' | 'average_position' | 'best_position';
  tertiary: 'points' | 'wins' | 'average_position' | 'best_position';
}

export interface CompetitionRestriction {
  type: 'rating' | 'team_size' | 'experience' | 'geographic';
  value: number | string;
  operator: 'min' | 'max' | 'equals' | 'not_equals';
}

export interface CompetitionSchedule {
  round: number;
  date: number;
  circuit: string;
  format: string;
  description: string;
}

export interface CompetitionReward {
  position: number;
  type: 'points' | 'achievement' | 'currency' | 'cosmetic';
  value: number | string;
  description: string;
}

interface TeamRacingService {
  // Team Management
  createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'currentMembers' | 'memberCount' | 'stats' | 'members' | 'invitations' | 'raceHistory' | 'achievements'>): Promise<Team>;
  updateTeam(teamId: string, updates: Partial<Team>): Promise<Team>;
  deleteTeam(teamId: string): Promise<boolean>;
  getTeam(teamId: string): Promise<Team | null>;
  getUserTeams(userId: string): Promise<Team[]>;
  searchTeams(query: string, filters?: TeamSearchFilters): Promise<Team[]>;
  
  // Team Membership
  joinTeam(teamId: string, userId: string, role?: TeamRole): Promise<boolean>;
  leaveTeam(teamId: string, userId: string): Promise<boolean>;
  kickMember(teamId: string, memberUserId: string, kickerId: string): Promise<boolean>;
  promoteMember(teamId: string, memberUserId: string, newRole: TeamRole): Promise<boolean>;
  demoteMember(teamId: string, memberUserId: string, newRole: TeamRole): Promise<boolean>;
  
  // Team Invitations
  inviteToTeam(teamId: string, inviterId: string, inviteeId: string, message?: string, role?: TeamRole): Promise<TeamInvitation>;
  acceptInvitation(invitationId: string, userId: string): Promise<boolean>;
  declineInvitation(invitationId: string, userId: string): Promise<boolean>;
  cancelInvitation(invitationId: string, userId: string): Promise<boolean>;
  getPendingInvitations(userId: string): Promise<TeamInvitation[]>;
  getTeamInvitations(teamId: string): Promise<TeamInvitation[]>;
  
  // Team Leaderboards
  getTeamLeaderboard(type: CompetitionType, timeRange: TimeRange): Promise<TeamLeaderboard>;
  getTeamRanking(teamId: string, type: CompetitionType, timeRange: TimeRange): Promise<number>;
  updateTeamRankings(): Promise<void>;
  
  // Team Competitions
  createCompetition(competitionData: Omit<TeamCompetition, 'id' | 'status' | 'leaderboard'>): Promise<TeamCompetition>;
  joinCompetition(teamId: string, competitionId: string): Promise<boolean>;
  leaveCompetition(teamId: string, competitionId: string): Promise<boolean>;
  getCompetitions(type?: CompetitionType, status?: CompetitionStatus): Promise<TeamCompetition[]>;
  getCompetitionLeaderboard(competitionId: string): Promise<TeamLeaderboard>;
  
  // Team Chat
  sendTeamMessage(teamId: string, senderId: string, message: string, type?: MessageType): Promise<TeamChatMessage>;
  getTeamChat(teamId: string, limit?: number): Promise<TeamChatMessage[]>;
  deleteMessage(messageId: string, userId: string): Promise<boolean>;
  reactToMessage(messageId: string, userId: string, emoji: string): Promise<boolean>;
  
  // Team Statistics
  getTeamStats(teamId: string): Promise<TeamStats>;
  getMemberStats(teamId: string, userId: string): Promise<MemberStats>;
  updateTeamStats(teamId: string, raceResult: TeamRaceResult): Promise<void>;
  getTeamPerformance(teamId: string, timeRange?: TimeRange): Promise<TeamPerformance>;
  
  // Team Achievements
  unlockAchievement(teamId: string, achievementId: string): Promise<TeamAchievement>;
  getTeamAchievements(teamId: string): Promise<TeamAchievement[]>;
  checkAchievements(teamId: string): Promise<TeamAchievement[]>;
  
  // Team Analytics
  getTeamAnalytics(teamId: string): Promise<TeamAnalytics>;
  getCompetitionAnalytics(competitionId: string): Promise<CompetitionAnalytics>;
  getGlobalTeamStats(): Promise<GlobalTeamStats>;
  
  // Team Settings
  updateTeamSettings(teamId: string, settings: Partial<TeamSettings>): Promise<TeamSettings>;
  getTeamSettings(teamId: string): Promise<TeamSettings>;
  
  // Team Recommendations
  getRecommendedTeams(userId: string): Promise<Team[]>;
  getRecommendedMembers(teamId: string): Promise<string[]>;
  getTeamCompatibility(teamId1: string, teamId2: string): Promise<number>;
  
  // Team Events & Notifications
  subscribeToTeamEvents(teamId: string, callback: (event: TeamEvent) => void): () => void;
  subscribeToUserTeamEvents(userId: string, callback: (event: TeamEvent) => void): () => void;
  
  // Team Validation
  validateTeamName(name: string): ValidationResult;
  validateTeamTag(tag: string): ValidationResult;
  validateTeamSettings(settings: TeamSettings): ValidationResult;
}

export interface TeamEvent {
  type: 'team_created' | 'team_deleted' | 'member_joined' | 'member_left' | 'member_promoted' | 'member_demoted' | 'invitation_sent' | 'invitation_accepted' | 'invitation_declined' | 'team_chat' | 'achievement_unlocked' | 'race_completed' | 'competition_joined';
  teamId: string;
  userId?: string;
  data: any;
  timestamp: number;
}

export interface TeamSearchFilters {
  isPublic?: boolean;
  minRating?: number;
  maxRating?: number;
  minMembers?: number;
  maxMembers?: number;
  activity?: 'active' | 'inactive';
  competition?: CompetitionType;
}

export interface TeamAnalytics {
  performance: TeamPerformance;
  memberActivity: Record<string, number>;
  communication: {
    messageCount: number;
    activeMembers: number;
    responseTime: number;
  };
  achievements: {
    unlocked: number;
    total: number;
    progress: number;
  };
  competitions: {
    participated: number;
    won: number;
    bestPosition: number;
  };
}

export interface CompetitionAnalytics {
  teamCount: number;
  participantCount: number;
  averageRating: number;
  completionRate: number;
  engagement: {
    activeTeams: number;
    averageRacesPerTeam: number;
    retentionRate: number;
  };
  performance: {
    averagePosition: number;
    averageScore: number;
    improvementRate: number;
  };
}

export interface GlobalTeamStats {
  totalTeams: number;
  activeTeams: number;
  totalMembers: number;
  averageTeamSize: number;
  totalRaces: number;
  averageRating: number;
  mostPopularCompetition: CompetitionType;
  topTeams: Team[];
  recentAchievements: TeamAchievement[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

class TeamRacingServiceImpl implements TeamRacingService {
  private teams: Map<string, Team> = new Map();
  private invitations: Map<string, TeamInvitation> = new Map();
  private competitions: Map<string, TeamCompetition> = new Map();
  private teamChats: Map<string, TeamChatMessage[]> = new Map();
  private achievements: Map<string, TeamAchievement> = new Map();
  private userTeams: Map<string, string[]> = new Map(); // userId -> teamIds
  private teamSubscriptions: Map<string, ((event: TeamEvent) => void)[]> = new Map();
  private userSubscriptions: Map<string, ((event: TeamEvent) => void)[]> = new Map();

  constructor() {
    this.initializeAchievements();
    this.initializeMockData();
  }

  private generateTeamId(): string {
    return `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInvitationId(): string {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCompetitionId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeAchievements(): void {
    const defaultAchievements: TeamAchievement[] = [
      {
        id: 'first_win',
        name: 'First Victory',
        description: 'Win your first team race',
        icon: '🏆',
        unlockedAt: 0,
        rarity: 'common',
        points: 10
      },
      {
        id: 'teamwork_master',
        name: 'Teamwork Master',
        description: 'Complete 10 races with the same team',
        icon: '🤝',
        unlockedAt: 0,
        rarity: 'rare',
        points: 25
      },
      {
        id: 'dominant_force',
        name: 'Dominant Force',
        description: 'Win 5 consecutive races',
        icon: '👑',
        unlockedAt: 0,
        rarity: 'epic',
        points: 50
      },
      {
        id: 'perfect_season',
        name: 'Perfect Season',
        description: 'Win a championship without losing a single race',
        icon: '⭐',
        unlockedAt: 0,
        rarity: 'legendary',
        points: 100
      },
      {
        id: 'recruiter',
        name: 'Recruiter',
        description: 'Recruit 5 members to your team',
        icon: '📢',
        unlockedAt: 0,
        rarity: 'common',
        points: 15
      },
      {
        id: 'loyal_member',
        name: 'Loyal Member',
        description: 'Stay with the same team for 100 days',
        icon: '💎',
        unlockedAt: 0,
        rarity: 'rare',
        points: 30
      }
    ];

    defaultAchievements.forEach(achievement => {
      this.achievements.set(achievement.id, achievement);
    });
  }

  private initializeMockData(): void {
    // Create some mock teams for demonstration
    const mockTeams: Team[] = [
      {
        id: 'team_1',
        name: 'Speed Demons',
        tag: 'SDMN',
        description: 'We live for speed and victory',
        color: '#FF0000',
        createdBy: 'user_1',
        createdAt: Date.now() - 86400000 * 30, // 30 days ago
        isActive: true,
        isPublic: true,
        maxMembers: 8,
        currentMembers: 5,
        memberCount: 5,
        averageRating: 1850,
        totalRaces: 45,
        wins: 28,
        losses: 17,
        points: 840,
        ranking: 1,
        achievements: [],
        settings: {
          allowInvites: true,
          requireApproval: false,
          minRating: 1500,
          maxMembers: 8,
          teamChat: true,
          voiceChat: true,
          privateRaces: false,
          autoAcceptInvites: false,
          teamColor: '#FF0000',
          emblemStyle: 'modern'
        },
        stats: {
          totalRaces: 45,
          totalWins: 28,
          totalLosses: 17,
          totalPoints: 840,
          averagePosition: 2.3,
          bestPosition: 1,
          winRate: 0.622,
          averageTeamScore: 85.2,
          bestTeamScore: 98.5,
          totalDistance: 1250000,
          totalDuration: 2700000,
          memberContributions: {},
          performance: {
            recentForm: [1, 2, 1, 3, 2, 1, 2, 1, 2, 1],
            momentum: 75,
            consistency: 82,
            improvement: 15,
            streak: 3,
            peakPerformance: 95
          }
        },
        members: [],
        invitations: [],
        raceHistory: []
      },
      {
        id: 'team_2',
        name: 'Thunder Racing',
        tag: 'THRN',
        description: 'Lightning fast and always ready',
        color: '#FFD700',
        createdBy: 'user_2',
        createdAt: Date.now() - 86400000 * 45, // 45 days ago
        isActive: true,
        isPublic: true,
        maxMembers: 6,
        currentMembers: 4,
        memberCount: 4,
        averageRating: 1780,
        totalRaces: 38,
        wins: 22,
        losses: 16,
        points: 660,
        ranking: 2,
        achievements: [],
        settings: {
          allowInvites: true,
          requireApproval: true,
          minRating: 1600,
          maxMembers: 6,
          teamChat: true,
          voiceChat: false,
          privateRaces: false,
          autoAcceptInvites: false,
          teamColor: '#FFD700',
          emblemStyle: 'bold'
        },
        stats: {
          totalRaces: 38,
          totalWins: 22,
          totalLosses: 16,
          totalPoints: 660,
          averagePosition: 2.8,
          bestPosition: 1,
          winRate: 0.579,
          averageTeamScore: 78.4,
          bestTeamScore: 92.1,
          totalDistance: 980000,
          totalDuration: 2100000,
          memberContributions: {},
          performance: {
            recentForm: [2, 3, 2, 2, 3, 2, 1, 2, 3, 2],
            momentum: 45,
            consistency: 75,
            improvement: 8,
            streak: 1,
            peakPerformance: 88
          }
        },
        members: [],
        invitations: [],
        raceHistory: []
      }
    ];

    mockTeams.forEach(team => {
      this.teams.set(team.id, team);
    });
  }

  private notifyTeamEvent(teamId: string, event: TeamEvent): void {
    // Notify team-specific subscribers
    const teamSubs = this.teamSubscriptions.get(teamId) || [];
    teamSubs.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in team subscription callback:', error);
      }
    });

    // Notify user-specific subscribers for team members
    const team = this.teams.get(teamId);
    if (team) {
      team.members.forEach(member => {
        const userSubs = this.userSubscriptions.get(member.userId) || [];
        userSubs.forEach(callback => {
          try {
            callback(event);
          } catch (error) {
            console.error('Error in user subscription callback:', error);
          }
        });
      });
    }
  }

  async createTeam(teamData: Omit<Team, 'id' | 'createdAt' | 'currentMembers' | 'memberCount' | 'stats' | 'members' | 'invitations' | 'raceHistory' | 'achievements'>): Promise<Team> {
    const newTeam: Team = {
      ...teamData,
      id: this.generateTeamId(),
      createdAt: Date.now(),
      currentMembers: 1,
      memberCount: 1,
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
      raceHistory: [],
      achievements: []
    };

    // Add creator as leader
    const creatorMember: TeamMember = {
      id: this.generateMessageId(),
      userId: teamData.createdBy,
      username: `User_${teamData.createdBy}`,
      role: 'leader',
      joinedAt: Date.now(),
      isActive: true,
      rating: 1500,
      races: 0,
      wins: 0,
      points: 0,
      contribution: 0,
      status: 'active',
      lastActive: Date.now(),
      achievements: [],
      stats: {
        individualRaces: 0,
        teamRaces: 0,
        individualWins: 0,
        teamWins: 0,
        averagePosition: 0,
        bestPosition: 0,
        contributionScore: 0,
        reliability: 100,
        teamwork: 100,
        communication: 100
      }
    };

    newTeam.members.push(creatorMember);
    this.teams.set(newTeam.id, newTeam);

    // Update user teams mapping
    if (!this.userTeams.has(teamData.createdBy)) {
      this.userTeams.set(teamData.createdBy, []);
    }
    this.userTeams.get(teamData.createdBy)!.push(newTeam.id);

    // Notify event
    this.notifyTeamEvent(newTeam.id, {
      type: 'team_created',
      teamId: newTeam.id,
      userId: teamData.createdBy,
      data: { team: newTeam },
      timestamp: Date.now()
    });

    return newTeam;
  }

  async updateTeam(teamId: string, updates: Partial<Team>): Promise<Team> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const updatedTeam = { ...team, ...updates };
    this.teams.set(teamId, updatedTeam);

    return updatedTeam;
  }

  async deleteTeam(teamId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    // Remove team from all user mappings
    team.members.forEach(member => {
      const userTeamIds = this.userTeams.get(member.userId) || [];
      const index = userTeamIds.indexOf(teamId);
      if (index > -1) {
        userTeamIds.splice(index, 1);
      }
    });

    // Clean up related data
    this.invitations.forEach((inv, key) => {
      if (inv.teamId === teamId) {
        this.invitations.delete(key);
      }
    });

    this.teamChats.delete(teamId);
    this.teams.delete(teamId);

    return true;
  }

  async getTeam(teamId: string): Promise<Team | null> {
    return this.teams.get(teamId) || null;
  }

  async getUserTeams(userId: string): Promise<Team[]> {
    const teamIds = this.userTeams.get(userId) || [];
    const teams: Team[] = [];
    
    for (const teamId of teamIds) {
      const team = this.teams.get(teamId);
      if (team) {
        teams.push(team);
      }
    }

    return teams;
  }

  async searchTeams(query: string, filters?: TeamSearchFilters): Promise<Team[]> {
    const teams = Array.from(this.teams.values());
    
    return teams.filter(team => {
      // Search query
      const matchesQuery = !query || 
        team.name.toLowerCase().includes(query.toLowerCase()) ||
        team.tag.toLowerCase().includes(query.toLowerCase()) ||
        team.description.toLowerCase().includes(query.toLowerCase());

      // Apply filters
      let matchesFilters = true;
      
      if (filters) {
        if (filters.isPublic !== undefined && team.isPublic !== filters.isPublic) {
          matchesFilters = false;
        }
        if (filters.minRating !== undefined && team.averageRating < filters.minRating) {
          matchesFilters = false;
        }
        if (filters.maxRating !== undefined && team.averageRating > filters.maxRating) {
          matchesFilters = false;
        }
        if (filters.minMembers !== undefined && team.currentMembers < filters.minMembers) {
          matchesFilters = false;
        }
        if (filters.maxMembers !== undefined && team.currentMembers > filters.maxMembers) {
          matchesFilters = false;
        }
      }

      return matchesQuery && matchesFilters;
    });
  }

  async joinTeam(teamId: string, userId: string, role: TeamRole = 'member'): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    // Check if user is already a member
    if (team.members.some(member => member.userId === userId)) {
      return false;
    }

    // Check team capacity
    if (team.currentMembers >= team.maxMembers) {
      return false;
    }

    // Check rating requirements
    if (team.settings.minRating > 0) {
      const userRating = await this.getUserRating(userId);
      if (userRating < team.settings.minRating) {
        return false;
      }
    }

    const newMember: TeamMember = {
      id: this.generateMessageId(),
      userId,
      username: `User_${userId}`,
      role,
      joinedAt: Date.now(),
      isActive: true,
      rating: await this.getUserRating(userId),
      races: 0,
      wins: 0,
      points: 0,
      contribution: 0,
      status: 'active',
      lastActive: Date.now(),
      achievements: [],
      stats: {
        individualRaces: 0,
        teamRaces: 0,
        individualWins: 0,
        teamWins: 0,
        averagePosition: 0,
        bestPosition: 0,
        contributionScore: 0,
        reliability: 100,
        teamwork: 100,
        communication: 100
      }
    };

    team.members.push(newMember);
    team.currentMembers++;
    team.memberCount++;

    // Update user teams mapping
    if (!this.userTeams.has(userId)) {
      this.userTeams.set(userId, []);
    }
    this.userTeams.get(userId)!.push(teamId);

    // Notify event
    this.notifyTeamEvent(teamId, {
      type: 'member_joined',
      teamId,
      userId,
      data: { member: newMember },
      timestamp: Date.now()
    });

    return true;
  }

  async leaveTeam(teamId: string, userId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const memberIndex = team.members.findIndex(member => member.userId === userId);
    if (memberIndex === -1) return false;

    const member = team.members[memberIndex];
    team.members.splice(memberIndex, 1);
    team.currentMembers--;
    team.memberCount--;

    // Update user teams mapping
    const userTeamIds = this.userTeams.get(userId) || [];
    const index = userTeamIds.indexOf(teamId);
    if (index > -1) {
      userTeamIds.splice(index, 1);
    }

    // If leader left, promote next member or delete team
    if (member.role === 'leader') {
      if (team.members.length > 0) {
        team.members[0].role = 'leader';
        this.notifyTeamEvent(teamId, {
          type: 'member_promoted',
          teamId,
          userId: team.members[0].userId,
          data: { newRole: 'leader', oldRole: team.members[0].role },
          timestamp: Date.now()
        });
      } else {
        // Delete empty team
        this.deleteTeam(teamId);
        return true;
      }
    }

    // Notify event
    this.notifyTeamEvent(teamId, {
      type: 'member_left',
      teamId,
      userId,
      data: { member },
      timestamp: Date.now()
    });

    return true;
  }

  async kickMember(teamId: string, memberUserId: string, kickerId: string): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    // Check if kicker has permission (leader or co-leader)
    const kicker = team.members.find(m => m.userId === kickerId);
    if (!kicker || (kicker.role !== 'leader' && kicker.role !== 'co_leader')) {
      return false;
    }

    // Cannot kick leader
    const memberToKick = team.members.find(m => m.userId === memberUserId);
    if (!memberToKick || memberToKick.role === 'leader') {
      return false;
    }

    return this.leaveTeam(teamId, memberUserId);
  }

  async promoteMember(teamId: string, memberUserId: string, newRole: TeamRole): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const member = team.members.find(m => m.userId === memberUserId);
    if (!member) return false;

    const oldRole = member.role;
    member.role = newRole;

    this.notifyTeamEvent(teamId, {
      type: 'member_promoted',
      teamId,
      userId: memberUserId,
      data: { newRole, oldRole },
      timestamp: Date.now()
    });

    return true;
  }

  async demoteMember(teamId: string, memberUserId: string, newRole: TeamRole): Promise<boolean> {
    const team = this.teams.get(teamId);
    if (!team) return false;

    const member = team.members.find(m => m.userId === memberUserId);
    if (!member) return false;

    const oldRole = member.role;
    member.role = newRole;

    this.notifyTeamEvent(teamId, {
      type: 'member_demoted',
      teamId,
      userId: memberUserId,
      data: { newRole, oldRole },
      timestamp: Date.now()
    });

    return true;
  }

  async inviteToTeam(teamId: string, inviterId: string, inviteeId: string, message?: string, role: TeamRole = 'member'): Promise<TeamInvitation> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    // Check if inviter has permission
    const inviter = team.members.find(m => m.userId === inviterId);
    if (!inviter || (inviter.role !== 'leader' && inviter.role !== 'co_leader')) {
      throw new Error('No permission to invite');
    }

    // Check if invitee is already a member
    if (team.members.some(m => m.userId === inviteeId)) {
      throw new Error('User is already a member');
    }

    // Check if there's already a pending invitation
    const existingInvitation = Array.from(this.invitations.values())
      .find(inv => inv.teamId === teamId && inv.inviteeId === inviteeId && inv.status === 'pending');
    
    if (existingInvitation) {
      throw new Error('Invitation already sent');
    }

    const invitation: TeamInvitation = {
      id: this.generateInvitationId(),
      teamId,
      inviterId,
      inviterName: inviter.username,
      inviteeId,
      inviteeName: `User_${inviteeId}`,
      message,
      status: 'pending',
      sentAt: Date.now(),
      expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
      role
    };

    this.invitations.set(invitation.id, invitation);

    // Notify event
    this.notifyTeamEvent(teamId, {
      type: 'invitation_sent',
      teamId,
      userId: inviterId,
      data: { invitation },
      timestamp: Date.now()
    });

    return invitation;
  }

  async acceptInvitation(invitationId: string, userId: string): Promise<boolean> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.inviteeId !== userId) {
      return false;
    }

    if (invitation.status !== 'pending') {
      return false;
    }

    if (Date.now() > invitation.expiresAt) {
      invitation.status = 'expired';
      return false;
    }

    // Join the team
    const joined = await this.joinTeam(invitation.teamId, userId, invitation.role);
    if (joined) {
      invitation.status = 'accepted';
      
      // Notify event
      this.notifyTeamEvent(invitation.teamId, {
        type: 'invitation_accepted',
        teamId: invitation.teamId,
        userId,
        data: { invitation },
        timestamp: Date.now()
      });
    }

    return joined;
  }

  async declineInvitation(invitationId: string, userId: string): Promise<boolean> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.inviteeId !== userId) {
      return false;
    }

    if (invitation.status !== 'pending') {
      return false;
    }

    invitation.status = 'declined';

    // Notify event
    this.notifyTeamEvent(invitation.teamId, {
      type: 'invitation_declined',
      teamId: invitation.teamId,
      userId,
      data: { invitation },
      timestamp: Date.now()
    });

    return true;
  }

  async cancelInvitation(invitationId: string, userId: string): Promise<boolean> {
    const invitation = this.invitations.get(invitationId);
    if (!invitation || invitation.inviterId !== userId) {
      return false;
    }

    if (invitation.status !== 'pending') {
      return false;
    }

    invitation.status = 'cancelled';

    // Notify event
    this.notifyTeamEvent(invitation.teamId, {
      type: 'invitation_cancelled',
      teamId: invitation.teamId,
      userId,
      data: { invitation },
      timestamp: Date.now()
    });

    return true;
  }

  async getPendingInvitations(userId: string): Promise<TeamInvitation[]> {
    return Array.from(this.invitations.values())
      .filter(inv => inv.inviteeId === userId && inv.status === 'pending');
  }

  async getTeamInvitations(teamId: string): Promise<TeamInvitation[]> {
    return Array.from(this.invitations.values())
      .filter(inv => inv.teamId === teamId && inv.status === 'pending');
  }

  async getTeamLeaderboard(type: CompetitionType, timeRange: TimeRange): Promise<TeamLeaderboard> {
    const teams = Array.from(this.teams.values())
      .filter(team => team.isActive && team.totalRaces > 0);

    // Sort teams based on competition type and time range
    const sortedTeams = teams.sort((a, b) => {
      switch (type) {
        case 'seasonal':
          return b.points - a.points;
        case 'tournament':
          return b.wins - a.wins;
        case 'championship':
          return (b.winRate * 100) - (a.winRate * 100);
        default:
          return b.points - a.points;
      }
    });

    const entries: TeamLeaderboardEntry[] = sortedTeams.map((team, index) => ({
      rank: index + 1,
      team,
      points: team.points,
      races: team.totalRaces,
      wins: team.wins,
      losses: team.losses,
      winRate: team.winRate,
      averagePosition: team.stats.averagePosition,
      form: team.stats.performance.momentum,
      change: 0, // Would calculate from previous ranking
      streak: team.stats.performance.streak,
      bestStreak: team.stats.performance.peakPerformance
    }));

    return {
      teams: entries,
      totalTeams: entries.length,
      lastUpdated: Date.now(),
      competitionType: type,
      timeRange
    };
  }

  async getTeamRanking(teamId: string, type: CompetitionType, timeRange: TimeRange): Promise<number> {
    const leaderboard = await this.getTeamLeaderboard(type, timeRange);
    const entry = leaderboard.teams.find(entry => entry.team.id === teamId);
    return entry ? entry.rank : -1;
  }

  async updateTeamRankings(): Promise<void> {
    // This would typically be called periodically or after races
    // Implementation would recalculate rankings based on recent performance
    console.log('Updating team rankings...');
  }

  async createCompetition(competitionData: Omit<TeamCompetition, 'id' | 'status' | 'leaderboard'>): Promise<TeamCompetition> {
    const competition: TeamCompetition = {
      ...competitionData,
      id: this.generateCompetitionId(),
      status: 'upcoming',
      leaderboard: {
        teams: [],
        totalTeams: 0,
        lastUpdated: Date.now(),
        competitionType: competitionData.type,
        timeRange: 'all_time'
      }
    };

    this.competitions.set(competition.id, competition);
    return competition;
  }

  async joinCompetition(teamId: string, competitionId: string): Promise<boolean> {
    const competition = this.competitions.get(competitionId);
    const team = this.teams.get(teamId);
    
    if (!competition || !team) return false;
    
    if (competition.status !== 'registration') return false;
    
    if (competition.currentTeams >= competition.maxTeams) return false;

    competition.currentTeams++;
    // Add team to competition leaderboard
    // Implementation details...

    return true;
  }

  async leaveCompetition(teamId: string, competitionId: string): Promise<boolean> {
    const competition = this.competitions.get(competitionId);
    if (!competition) return false;

    competition.currentTeams--;
    // Remove team from competition leaderboard
    // Implementation details...

    return true;
  }

  async getCompetitions(type?: CompetitionType, status?: CompetitionStatus): Promise<TeamCompetition[]> {
    const competitions = Array.from(this.competitions.values());
    
    return competitions.filter(comp => {
      if (type && comp.type !== type) return false;
      if (status && comp.status !== status) return false;
      return true;
    });
  }

  async getCompetitionLeaderboard(competitionId: string): Promise<TeamLeaderboard> {
    const competition = this.competitions.get(competitionId);
    if (!competition) {
      throw new Error('Competition not found');
    }

    return competition.leaderboard;
  }

  async sendTeamMessage(teamId: string, senderId: string, message: string, type: MessageType = 'text'): Promise<TeamChatMessage> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => m.userId === senderId);
    if (!member) {
      throw new Error('Not a team member');
    }

    const chatMessage: TeamChatMessage = {
      id: this.generateMessageId(),
      teamId,
      senderId,
      senderName: member.username,
      message,
      timestamp: Date.now(),
      type,
      reactions: [],
      isEdited: false
    };

    if (!this.teamChats.has(teamId)) {
      this.teamChats.set(teamId, []);
    }
    this.teamChats.get(teamId)!.push(chatMessage);

    // Notify event
    this.notifyTeamEvent(teamId, {
      type: 'team_chat',
      teamId,
      userId: senderId,
      data: { message: chatMessage },
      timestamp: Date.now()
    });

    return chatMessage;
  }

  async getTeamChat(teamId: string, limit: number = 50): Promise<TeamChatMessage[]> {
    const messages = this.teamChats.get(teamId) || [];
    return messages.slice(-limit);
  }

  async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // Find and delete message if user has permission
    for (const [teamId, messages] of this.teamChats) {
      const messageIndex = messages.findIndex(msg => msg.id === messageId);
      if (messageIndex > -1) {
        const message = messages[messageIndex];
        if (message.senderId === userId) {
          messages.splice(messageIndex, 1);
          return true;
        }
      }
    }
    return false;
  }

  async reactToMessage(messageId: string, userId: string, emoji: string): Promise<boolean> {
    for (const messages of this.teamChats.values()) {
      const message = messages.find(msg => msg.id === messageId);
      if (message) {
        const existingReaction = message.reactions.find(r => r.emoji === emoji);
        if (existingReaction) {
          if (existingReaction.users.includes(userId)) {
            // Remove reaction
            existingReaction.users = existingReaction.users.filter(u => u !== userId);
            existingReaction.count--;
          } else {
            // Add reaction
            existingReaction.users.push(userId);
            existingReaction.count++;
          }
        } else {
          // Create new reaction
          message.reactions.push({
            emoji,
            users: [userId],
            count: 1
          });
        }
        return true;
      }
    }
    return false;
  }

  async getTeamStats(teamId: string): Promise<TeamStats> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    return team.stats;
  }

  async getMemberStats(teamId: string, userId: string): Promise<MemberStats> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const member = team.members.find(m => m.userId === userId);
    if (!member) {
      throw new Error('Member not found');
    }

    return member.stats;
  }

  async updateTeamStats(teamId: string, raceResult: TeamRaceResult): Promise<void> {
    const team = this.teams.get(teamId);
    if (!team) return;

    team.stats.totalRaces++;
    team.stats.totalPoints += raceResult.points;
    
    if (raceResult.result === 'win') {
      team.stats.totalWins++;
    } else {
      team.stats.totalLosses++;
    }

    team.stats.averagePosition = (team.stats.averagePosition * (team.stats.totalRaces - 1) + raceResult.position) / team.stats.totalRaces;
    
    if (raceResult.position < team.stats.bestPosition || team.stats.bestPosition === 0) {
      team.stats.bestPosition = raceResult.position;
    }

    team.stats.winRate = team.stats.totalWins / team.stats.totalRaces;

    // Update performance metrics
    team.stats.performance.recentForm.push(raceResult.position);
    if (team.stats.performance.recentForm.length > 10) {
      team.stats.performance.recentForm.shift();
    }

    // Add to race history
    team.raceHistory.push(raceResult);

    // Check achievements
    await this.checkAchievements(teamId);
  }

  async getTeamPerformance(teamId: string, timeRange?: TimeRange): Promise<TeamPerformance> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    return team.stats.performance;
  }

  async unlockAchievement(teamId: string, achievementId: string): Promise<TeamAchievement> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const achievementTemplate = this.achievements.get(achievementId);
    if (!achievementTemplate) {
      throw new Error('Achievement not found');
    }

    // Check if already unlocked
    if (team.achievements.some(a => a.id === achievementId)) {
      throw new Error('Achievement already unlocked');
    }

    const achievement: TeamAchievement = {
      ...achievementTemplate,
      unlockedAt: Date.now()
    };

    team.achievements.push(achievement);

    // Notify event
    this.notifyTeamEvent(teamId, {
      type: 'achievement_unlocked',
      teamId,
      data: { achievement },
      timestamp: Date.now()
    });

    return achievement;
  }

  async getTeamAchievements(teamId: string): Promise<TeamAchievement[]> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    return team.achievements;
  }

  async checkAchievements(teamId: string): Promise<TeamAchievement[]> {
    const team = this.teams.get(teamId);
    if (!team) return [];

    const newAchievements: TeamAchievement[] = [];

    // Check first win
    if (team.stats.totalWins === 1 && !team.achievements.some(a => a.id === 'first_win')) {
      newAchievements.push(await this.unlockAchievement(teamId, 'first_win'));
    }

    // Check teamwork master (10 races)
    if (team.stats.totalRaces >= 10 && !team.achievements.some(a => a.id === 'teamwork_master')) {
      newAchievements.push(await this.unlockAchievement(teamId, 'teamwork_master'));
    }

    // Check dominant force (5 consecutive wins)
    if (team.stats.performance.streak >= 5 && !team.achievements.some(a => a.id === 'dominant_force')) {
      newAchievements.push(await this.unlockAchievement(teamId, 'dominant_force'));
    }

    return newAchievements;
  }

  async getTeamAnalytics(teamId: string): Promise<TeamAnalytics> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    const chatMessages = this.teamChats.get(teamId) || [];
    const activeMembers = team.members.filter(m => m.status === 'active').length;

    return {
      performance: team.stats.performance,
      memberActivity: {},
      communication: {
        messageCount: chatMessages.length,
        activeMembers,
        responseTime: 0 // Would calculate from chat data
      },
      achievements: {
        unlocked: team.achievements.length,
        total: this.achievements.size,
        progress: (team.achievements.length / this.achievements.size) * 100
      },
      competitions: {
        participated: 0, // Would track from competition data
        won: 0,
        bestPosition: 0
      }
    };
  }

  async getCompetitionAnalytics(competitionId: string): Promise<CompetitionAnalytics> {
    const competition = this.competitions.get(competitionId);
    if (!competition) {
      throw new Error('Competition not found');
    }

    return {
      teamCount: competition.currentTeams,
      participantCount: competition.currentTeams * 4, // Average team size
      averageRating: 0, // Would calculate from team data
      completionRate: 0,
      engagement: {
        activeTeams: competition.currentTeams,
        averageRacesPerTeam: 0,
        retentionRate: 0
      },
      performance: {
        averagePosition: 0,
        averageScore: 0,
        improvementRate: 0
      }
    };
  }

  async getGlobalTeamStats(): Promise<GlobalTeamStats> {
    const teams = Array.from(this.teams.values());
    const activeTeams = teams.filter(t => t.isActive);

    return {
      totalTeams: teams.length,
      activeTeams: activeTeams.length,
      totalMembers: activeTeams.reduce((sum, team) => sum + team.currentMembers, 0),
      averageTeamSize: activeTeams.length > 0 ? activeTeams.reduce((sum, team) => sum + team.currentMembers, 0) / activeTeams.length : 0,
      totalRaces: activeTeams.reduce((sum, team) => sum + team.stats.totalRaces, 0),
      averageRating: activeTeams.length > 0 ? activeTeams.reduce((sum, team) => sum + team.averageRating, 0) / activeTeams.length : 0,
      mostPopularCompetition: 'seasonal',
      topTeams: teams.sort((a, b) => b.points - a.points).slice(0, 10),
      recentAchievements: []
    };
  }

  async updateTeamSettings(teamId: string, settings: Partial<TeamSettings>): Promise<TeamSettings> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    team.settings = { ...team.settings, ...settings };
    return team.settings;
  }

  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    const team = this.teams.get(teamId);
    if (!team) {
      throw new Error('Team not found');
    }

    return team.settings;
  }

  async getRecommendedTeams(userId: string): Promise<Team[]> {
    const userRating = await this.getUserRating(userId);
    const userTeams = await this.getUserTeams(userId);
    const userTeamIds = new Set(userTeams.map(t => t.id));

    return Array.from(this.teams.values())
      .filter(team => 
        team.isPublic && 
        team.isActive && 
        !userTeamIds.has(team.id) &&
        team.currentMembers < team.maxMembers &&
        team.averageRating >= userRating - 200 &&
        team.averageRating <= userRating + 200
      )
      .sort((a, b) => {
        // Prioritize teams with similar rating and good performance
        const ratingDiffA = Math.abs(a.averageRating - userRating);
        const ratingDiffB = Math.abs(b.averageRating - userRating);
        
        if (ratingDiffA !== ratingDiffB) {
          return ratingDiffA - ratingDiffB;
        }
        
        return b.stats.winRate - a.stats.winRate;
      })
      .slice(0, 10);
  }

  async getRecommendedMembers(teamId: string): Promise<string[]> {
    const team = this.teams.get(teamId);
    if (!team) return [];

    // Mock implementation - would use actual user data
    const allUsers = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];
    const currentMembers = new Set(team.members.map(m => m.userId));
    
    return allUsers.filter(userId => !currentMembers.has(userId));
  }

  async getTeamCompatibility(teamId1: string, teamId2: string): Promise<number> {
    const team1 = this.teams.get(teamId1);
    const team2 = this.teams.get(teamId2);
    
    if (!team1 || !team2) return 0;

    // Calculate compatibility based on various factors
    const ratingDiff = Math.abs(team1.averageRating - team2.averageRating);
    const ratingScore = Math.max(0, 100 - ratingDiff / 10);
    
    const activityScore = (team1.stats.performance.momentum + team2.stats.performance.momentum) / 2;
    
    const sizeCompatibility = Math.max(0, 100 - Math.abs(team1.currentMembers - team2.currentMembers) * 10);
    
    return (ratingScore + activityScore + sizeCompatibility) / 3;
  }

  subscribeToTeamEvents(teamId: string, callback: (event: TeamEvent) => void): () => void {
    if (!this.teamSubscriptions.has(teamId)) {
      this.teamSubscriptions.set(teamId, []);
    }
    this.teamSubscriptions.get(teamId)!.push(callback);

    return () => {
      const subs = this.teamSubscriptions.get(teamId);
      if (subs) {
        const index = subs.indexOf(callback);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  subscribeToUserTeamEvents(userId: string, callback: (event: TeamEvent) => void): () => void {
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, []);
    }
    this.userSubscriptions.get(userId)!.push(callback);

    return () => {
      const subs = this.userSubscriptions.get(userId);
      if (subs) {
        const index = subs.indexOf(callback);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  validateTeamName(name: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Team name is required');
    }

    if (name.length < 3) {
      errors.push('Team name must be at least 3 characters');
    }

    if (name.length > 30) {
      errors.push('Team name must be less than 30 characters');
    }

    if (!/^[a-zA-Z0-9\s\-_]+$/.test(name)) {
      errors.push('Team name can only contain letters, numbers, spaces, hyphens, and underscores');
    }

    // Check for existing team names
    const existingTeam = Array.from(this.teams.values()).find(t => 
      t.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingTeam) {
      errors.push('Team name already exists');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateTeamTag(tag: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!tag || tag.trim().length === 0) {
      errors.push('Team tag is required');
    }

    if (tag.length < 2) {
      errors.push('Team tag must be at least 2 characters');
    }

    if (tag.length > 4) {
      errors.push('Team tag must be less than 4 characters');
    }

    if (!/^[A-Z0-9]+$/.test(tag)) {
      errors.push('Team tag can only contain uppercase letters and numbers');
    }

    // Check for existing team tags
    const existingTeam = Array.from(this.teams.values()).find(t => 
      t.tag.toUpperCase() === tag.toUpperCase()
    );
    
    if (existingTeam) {
      errors.push('Team tag already exists');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateTeamSettings(settings: TeamSettings): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (settings.maxMembers < 2) {
      errors.push('Team must have at least 2 members');
    }

    if (settings.maxMembers > 12) {
      errors.push('Team cannot have more than 12 members');
    }

    if (settings.minRating < 0) {
      errors.push('Minimum rating cannot be negative');
    }

    if (settings.minRating > 3000) {
      warnings.push('Very high minimum rating may limit team growth');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async getUserRating(userId: string): Promise<number> {
    // Mock implementation - would fetch from user service
    return 1500 + Math.random() * 500;
  }
}

// Singleton instance
let teamRacingServiceInstance: TeamRacingService | null = null;

export function getTeamRacingService(): TeamRacingService {
  if (!teamRacingServiceInstance) {
    teamRacingServiceInstance = new TeamRacingServiceImpl();
  }
  return teamRacingServiceInstance;
}

export { TeamRacingServiceImpl };
