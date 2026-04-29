/**
 * Team-Based Racing E2E Tests
 * 
 * Comprehensive end-to-end tests for the team-based racing system
 * Covers team creation, management, invitations, leaderboards, and competitions
 */

import { useState, useEffect } from 'react';
import { getTeamRacingService, Team, TeamInvitation, TeamRole, CompetitionType, TimeRange } from '../services/teamRacing.service';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration: number;
  error?: string;
  details?: string;
}

interface TeamTestSuite {
  name: string;
  description: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  isRunning: boolean;
}

export const TeamE2ETests: React.FC = () => {
  const teamsService = getTeamRacingService();
  
  const [testSuites, setTestSuites] = useState<TeamTestSuite[]>([
    {
      name: 'Team Creation Tests',
      description: 'Test team creation workflow and validation',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      isRunning: false
    },
    {
      name: 'Team Invitation Tests',
      description: 'Test team invitation and joining system',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      isRunning: false
    },
    {
      name: 'Team Management Tests',
      description: 'Test team member management and roles',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      isRunning: false
    },
    {
      name: 'Team Leaderboard Tests',
      description: 'Test team rankings and competitions',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      isRunning: false
    },
    {
      name: 'Team Communication Tests',
      description: 'Test team chat and messaging system',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      isRunning: false
    },
    {
      name: 'Team Statistics Tests',
      description: 'Test team analytics and achievements',
      tests: [],
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      totalDuration: 0,
      isRunning: false
    }
  ]);

  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentSuiteIndex, setCurrentSuiteIndex] = useState(0);

  const runSingleTest = async (testName: string, testFunction: () => Promise<any>): Promise<TestResult> => {
    const startTime = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        name: testName,
        status: 'passed',
        duration,
        details: result
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      return {
        name: testName,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  // Team Creation Tests
  const runTeamCreationTests = async () => {
    const suiteIndex = 0;
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].isRunning = true;
      updated[suiteIndex].tests = [];
      return updated;
    });

    const tests = [
      await runSingleTest('Create Public Team', async () => {
        const teamData = {
          name: 'Test Public Team',
          tag: 'TPT',
          description: 'A test public team',
          color: '#FF0000',
          createdBy: 'test_user_1',
          isActive: true,
          isPublic: true,
          maxMembers: 8,
          averageRating: 1500,
          totalRaces: 0,
          wins: 0,
          losses: 0,
          points: 0,
          ranking: 0,
          achievements: [],
          settings: {
            allowInvites: true,
            requireApproval: false,
            minRating: 0,
            maxMembers: 8,
            teamChat: true,
            voiceChat: false,
            privateRaces: false,
            autoAcceptInvites: false,
            teamColor: '#FF0000',
            emblemStyle: 'modern'
          },
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
        };

        const team = await teamsService.createTeam(teamData);
        
        if (!team.id) throw new Error('Team ID not generated');
        if (team.name !== teamData.name) throw new Error('Team name not set correctly');
        if (team.tag !== teamData.tag) throw new Error('Team tag not set correctly');
        if (!team.isPublic) throw new Error('Team should be public');
        if (team.currentMembers !== 1) throw new Error('Team should have 1 member (creator)');
        
        return `Team created successfully: ${team.name} (${team.id})`;
      }),

      await runSingleTest('Create Private Team', async () => {
        const teamData = {
          name: 'Test Private Team',
          tag: 'TPT2',
          description: 'A test private team',
          color: '#00FF00',
          createdBy: 'test_user_2',
          isActive: true,
          isPublic: false,
          maxMembers: 6,
          averageRating: 1600,
          totalRaces: 0,
          wins: 0,
          losses: 0,
          points: 0,
          ranking: 0,
          achievements: [],
          settings: {
            allowInvites: true,
            requireApproval: true,
            minRating: 1500,
            maxMembers: 6,
            teamChat: true,
            voiceChat: true,
            privateRaces: false,
            autoAcceptInvites: false,
            teamColor: '#00FF00',
            emblemStyle: 'modern'
          },
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
        };

        const team = await teamsService.createTeam(teamData);
        
        if (team.isPublic) throw new Error('Team should be private');
        if (team.settings.requireApproval !== true) throw new Error('Team should require approval');
        if (team.settings.minRating !== 1500) throw new Error('Team should have min rating requirement');
        
        return `Private team created successfully: ${team.name}`;
      }),

      await runSingleTest('Validate Team Name', async () => {
        const invalidNames = ['', 'a', 'This is a very long team name that exceeds the maximum allowed length of thirty characters'];
        
        for (const invalidName of invalidNames) {
          const validation = teamsService.validateTeamName(invalidName);
          if (validation.valid) throw new Error(`Invalid name "${invalidName}" should fail validation`);
        }
        
        const validName = 'Valid Team Name';
        const validation = teamsService.validateTeamName(validName);
        if (!validation.valid) throw new Error(`Valid name "${validName}" should pass validation`);
        
        return 'Team name validation working correctly';
      }),

      await runSingleTest('Validate Team Tag', async () => {
        const invalidTags = ['', 'a', 'toolong', 'invalid', 'lowercase'];
        
        for (const invalidTag of invalidTags) {
          const validation = teamsService.validateTeamTag(invalidTag);
          if (validation.valid) throw new Error(`Invalid tag "${invalidTag}" should fail validation`);
        }
        
        const validTag = 'TAG1';
        const validation = teamsService.validateTeamTag(validTag);
        if (!validation.valid) throw new Error(`Valid tag "${validTag}" should pass validation`);
        
        return 'Team tag validation working correctly';
      }),

      await runSingleTest('Update Team Settings', async () => {
        // Create a team first
        const team = await teamsService.createTeam({
          name: 'Settings Test Team',
          tag: 'SET',
          description: 'Team for testing settings',
          color: '#0000FF',
          createdBy: 'test_user_3',
          isActive: true,
          isPublic: true,
          maxMembers: 8,
          averageRating: 1500,
          totalRaces: 0,
          wins: 0,
          losses: 0,
          points: 0,
          ranking: 0,
          achievements: [],
          settings: {
            allowInvites: true,
            requireApproval: false,
            minRating: 0,
            maxMembers: 8,
            teamChat: true,
            voiceChat: false,
            privateRaces: false,
            autoAcceptInvites: false,
            teamColor: '#0000FF',
            emblemStyle: 'modern'
          },
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

        // Update settings
        const newSettings = await teamsService.updateTeamSettings(team.id, {
          requireApproval: true,
          minRating: 1600,
          voiceChat: true
        });

        if (newSettings.requireApproval !== true) throw new Error('Require approval not updated');
        if (newSettings.minRating !== 1600) throw new Error('Min rating not updated');
        if (newSettings.voiceChat !== true) throw new Error('Voice chat not updated');
        
        return 'Team settings updated successfully';
      })
    ];

    // Update test suite results
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex] = {
        ...updated[suiteIndex],
        tests,
        totalTests: tests.length,
        passedTests,
        failedTests,
        totalDuration,
        isRunning: false
      };
      return updated;
    });

    return tests;
  };

  // Team Invitation Tests
  const runTeamInvitationTests = async () => {
    const suiteIndex = 1;
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].isRunning = true;
      updated[suiteIndex].tests = [];
      return updated;
    });

    // Create teams for testing
    const team1 = await teamsService.createTeam({
      name: 'Invitation Test Team 1',
      tag: 'ITT1',
      description: 'Team for testing invitations',
      color: '#FF6600',
      createdBy: 'team_owner_1',
      isActive: true,
      isPublic: true,
      maxMembers: 8,
      averageRating: 1500,
      totalRaces: 0,
      wins: 0,
      losses: 0,
      points: 0,
      ranking: 0,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: false,
        minRating: 0,
        maxMembers: 8,
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#FF6600',
        emblemStyle: 'modern'
      },
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

    const team2 = await teamsService.createTeam({
      name: 'Invitation Test Team 2',
      tag: 'ITT2',
      description: 'Private team for testing invitations',
      color: '#0066FF',
      createdBy: 'team_owner_2',
      isActive: true,
      isPublic: false,
      maxMembers: 6,
      averageRating: 1600,
      totalRaces: 0,
      wins: 0,
      losses: 0,
      points: 0,
      ranking: 0,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: true,
        minRating: 1500,
        maxMembers: 6,
        teamChat: true,
        voiceChat: true,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#0066FF',
        emblemStyle: 'modern'
      },
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

    const tests = [
      await runSingleTest('Send Team Invitation', async () => {
        const invitation = await teamsService.inviteToTeam(
          team1.id,
          'team_owner_1',
          'test_user_invitee',
          'Welcome to our team! We would love to have you join us.',
          'member'
        );

        if (!invitation.id) throw new Error('Invitation ID not generated');
        if (invitation.teamId !== team1.id) throw new Error('Team ID not set correctly');
        if (invitation.inviterId !== 'team_owner_1') throw new Error('Inviter ID not set correctly');
        if (invitation.inviteeId !== 'test_user_invitee') throw new Error('Invitee ID not set correctly');
        if (invitation.status !== 'pending') throw new Error('Invitation should be pending');
        
        return `Invitation sent successfully: ${invitation.id}`;
      }),

      await runSingleTest('Accept Team Invitation', async () => {
        // Send invitation first
        const invitation = await teamsService.inviteToTeam(
          team1.id,
          'team_owner_1',
          'test_user_accepter',
          'Please join our team!',
          'member'
        );

        // Accept the invitation
        const accepted = await teamsService.acceptInvitation(invitation.id, 'test_user_accepter');
        
        if (!accepted) throw new Error('Invitation acceptance failed');
        
        // Verify user joined the team
        const userTeams = await teamsService.getUserTeams('test_user_accepter');
        const joinedTeam = userTeams.find(t => t.id === team1.id);
        
        if (!joinedTeam) throw new Error('User did not join the team');
        
        return 'Invitation accepted and user joined team successfully';
      }),

      await runSingleTest('Decline Team Invitation', async () => {
        // Send invitation first
        const invitation = await teamsService.inviteToTeam(
          team1.id,
          'team_owner_1',
          'test_user_decliner',
          'Please join our team!',
          'member'
        );

        // Decline the invitation
        const declined = await teamsService.declineInvitation(invitation.id, 'test_user_decliner');
        
        if (!declined) throw new Error('Invitation decline failed');
        
        // Verify user did not join the team
        const userTeams = await teamsService.getUserTeams('test_user_decliner');
        const joinedTeam = userTeams.find(t => t.id === team1.id);
        
        if (joinedTeam) throw new Error('User should not have joined the team');
        
        return 'Invitation declined successfully';
      }),

      await runSingleTest('Cancel Team Invitation', async () => {
        // Send invitation first
        const invitation = await teamsService.inviteToTeam(
          team1.id,
          'team_owner_1',
          'test_user_cancel',
          'Please join our team!',
          'member'
        );

        // Cancel the invitation
        const cancelled = await teamsService.cancelInvitation(invitation.id, 'team_owner_1');
        
        if (!cancelled) throw new Error('Invitation cancellation failed');
        
        // Try to accept cancelled invitation (should fail)
        const accepted = await teamsService.acceptInvitation(invitation.id, 'test_user_cancel');
        
        if (accepted) throw new Error('Cancelled invitation should not be acceptible');
        
        return 'Invitation cancelled successfully';
      }),

      await runSingleTest('Join Public Team Directly', async () => {
        const userId = 'test_user_direct_join';
        
        // Join public team directly
        const joined = await teamsService.joinTeam(team1.id, userId);
        
        if (!joined) throw new Error('Failed to join public team');
        
        // Verify user joined the team
        const userTeams = await teamsService.getUserTeams(userId);
        const joinedTeam = userTeams.find(t => t.id === team1.id);
        
        if (!joinedTeam) throw new Error('User did not join the team');
        
        return 'User joined public team directly successfully';
      }),

      await runSingleTest('Join Private Team with Rating Requirement', async () => {
        const highRatingUser = 'test_user_high_rating';
        const lowRatingUser = 'test_user_low_rating';
        
        // Try to join private team with high rating user (should succeed)
        const joinedHigh = await teamsService.joinTeam(team2.id, highRatingUser);
        if (!joinedHigh) throw new Error('High rating user should be able to join');
        
        // Try to join private team with low rating user (should fail)
        const joinedLow = await teamsService.joinTeam(team2.id, lowRatingUser);
        if (joinedLow) throw new Error('Low rating user should not be able to join');
        
        return 'Rating requirement validation working correctly';
      }),

      await runSingleTest('Get Pending Invitations', async () => {
        // Send multiple invitations
        const invitation1 = await teamsService.inviteToTeam(
          team1.id,
          'team_owner_1',
          'test_user_pending1',
          'Please join our team!',
          'member'
        );

        const invitation2 = await teamsService.inviteToTeam(
          team1.id,
          'team_owner_1',
          'test_user_pending2',
          'Please join our team!',
          'member'
        );

        // Get pending invitations for first user
        const pendingInvitations = await teamsService.getPendingInvitations('test_user_pending1');
        
        if (pendingInvitations.length !== 1) throw new Error('Should have 1 pending invitation');
        if (pendingInvitations[0].id !== invitation1.id) throw new Error('Wrong invitation returned');
        
        // Get pending invitations for second user
        const pendingInvitations2 = await teamsService.getPendingInvitations('test_user_pending2');
        
        if (pendingInvitations2.length !== 1) throw new Error('Should have 1 pending invitation');
        if (pendingInvitations2[0].id !== invitation2.id) throw new Error('Wrong invitation returned');
        
        return 'Pending invitations retrieved successfully';
      })
    ];

    // Update test suite results
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex] = {
        ...updated[suiteIndex],
        tests,
        totalTests: tests.length,
        passedTests,
        failedTests,
        totalDuration,
        isRunning: false
      };
      return updated;
    });

    return tests;
  };

  // Team Management Tests
  const runTeamManagementTests = async () => {
    const suiteIndex = 2;
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].isRunning = true;
      updated[suiteIndex].tests = [];
      return updated;
    });

    // Create a team for management tests
    const team = await teamsService.createTeam({
      name: 'Management Test Team',
      tag: 'MTT',
      description: 'Team for testing management features',
      color: '#9900FF',
      createdBy: 'test_manager_owner',
      isActive: true,
      isPublic: true,
      maxMembers: 8,
      averageRating: 1500,
      totalRaces: 0,
      wins: 0,
      losses: 0,
      points: 0,
      ranking: 0,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: false,
        minRating: 0,
        maxMembers: 8,
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#9900FF',
        emblemStyle: 'modern'
      },
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

    const tests = [
      await runSingleTest('Promote Team Member', async () => {
        // Add members first
        await teamsService.joinTeam(team.id, 'test_member_1');
        await teamsService.joinTeam(team.id, 'test_member_2');
        
        // Promote member to captain
        const promoted = await teamsService.promoteMember(team.id, 'test_member_1', 'captain');
        
        if (!promoted) throw new Error('Member promotion failed');
        
        // Verify promotion
        const updatedTeam = await teamsService.getTeam(team.id);
        const member = updatedTeam?.members.find(m => m.userId === 'test_member_1');
        
        if (!member) throw new Error('Member not found');
        if (member.role !== 'captain') throw new Error('Member role not updated');
        
        return 'Member promoted to captain successfully';
      }),

      await runSingleTest('Demote Team Member', async () => {
        // Add member
        await teamsService.joinTeam(team.id, 'test_member_3');
        
        // Promote to captain first
        await teamsService.promoteMember(team.id, 'test_member_3', 'captain');
        
        // Demote back to member
        const demoted = await teamsService.demoteMember(team.id, 'test_member_3', 'member');
        
        if (!demoted) throw new Error('Member demotion failed');
        
        // Verify demotion
        const updatedTeam = await teamsService.getTeam(team.id);
        const member = updatedTeam?.members.find(m => m.userId === 'test_member_3');
        
        if (!member) throw new Error('Member not found');
        if (member.role !== 'member') throw new Error('Member role not updated');
        
        return 'Member demoted successfully';
      }),

      await runSingleTest('Kick Team Member', async () => {
        // Add member
        await teamsService.joinTeam(team.id, 'test_member_kick');
        
        // Kick member (as leader)
        const kicked = await teamsService.kickMember(team.id, 'test_member_kick', 'test_manager_owner');
        
        if (!kicked) throw new Error('Member kick failed');
        
        // Verify member is no longer in team
        const userTeams = await teamsService.getUserTeams('test_member_kick');
        const isStillInTeam = userTeams.some(t => t.id === team.id);
        
        if (isStillInTeam) throw new Error('Kicked member should not be in team');
        
        return 'Member kicked successfully';
      }),

      await runSingleTest('Leave Team', async () => {
        // Add member
        await teamsService.joinTeam(team.id, 'test_member_leave');
        
        // Member leaves team
        const left = await teamsService.leaveTeam(team.id, 'test_member_leave');
        
        if (!left) throw new Error('Member leave failed');
        
        // Verify member is no longer in team
        const userTeams = await teamsService.getUserTeams('test_member_leave');
        const isStillInTeam = userTeams.some(t => t.id === team.id);
        
        if (isStillInTeam) throw new Error('Member who left should not be in team');
        
        return 'Member left team successfully';
      }),

      await runSingleTest('Delete Team', async () => {
        // Create a team for deletion test
        const deleteTestTeam = await teamsService.createTeam({
          name: 'Delete Test Team',
          tag: 'DEL',
          description: 'Team for testing deletion',
          color: '#FF0066',
          createdBy: 'test_deleter',
          isActive: true,
          isPublic: true,
          maxMembers: 4,
          averageRating: 1500,
          totalRaces: 0,
          wins: 0,
          losses: 0,
          points: 0,
          ranking: 0,
          achievements: [],
          settings: {
            allowInvites: true,
            requireApproval: false,
            minRating: 0,
            maxMembers: 4,
            teamChat: true,
            voiceChat: false,
            privateRaces: false,
            autoAcceptInvites: false,
            teamColor: '#FF0066',
            emblemStyle: 'modern'
          },
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

        // Delete the team
        const deleted = await teamsService.deleteTeam(deleteTestTeam.id);
        
        if (!deleted) throw new Error('Team deletion failed');
        
        // Verify team no longer exists
        const retrievedTeam = await teamsService.getTeam(deleteTestTeam.id);
        
        if (retrievedTeam) throw new Error('Deleted team should not exist');
        
        return 'Team deleted successfully';
      }),

      await runSingleTest('Team Role Hierarchy', async () => {
        // Add multiple members
        await teamsService.joinTeam(team.id, 'test_role_1');
        await teamsService.joinTeam(team.id, 'test_role_2');
        await teamsService.joinTeam(team.id, 'test_role_3');
        
        // Promote to different roles
        await teamsService.promoteMember(team.id, 'test_role_1', 'co_leader');
        await teamsService.promoteMember(team.id, 'test_role_2', 'captain');
        
        // Verify role hierarchy
        const updatedTeam = await teamsService.getTeam(team.id);
        const members = updatedTeam?.members || [];
        
        const leader = members.find(m => m.userId === 'test_manager_owner');
        const coLeader = members.find(m => m.userId === 'test_role_1');
        const captain = members.find(m => m.userId === 'test_role_2');
        const regularMember = members.find(m => m.userId === 'test_role_3');
        
        if (leader?.role !== 'leader') throw new Error('Leader role incorrect');
        if (coLeader?.role !== 'co_leader') throw new Error('Co-leader role incorrect');
        if (captain?.role !== 'captain') throw new Error('Captain role incorrect');
        if (regularMember?.role !== 'member') throw new Error('Member role incorrect');
        
        return 'Team role hierarchy working correctly';
      })
    ];

    // Update test suite results
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex] = {
        ...updated[suiteIndex],
        tests,
        totalTests: tests.length,
        passedTests,
        failedTests,
        totalDuration,
        isRunning: false
      };
      return updated;
    });

    return tests;
  };

  // Team Leaderboard Tests
  const runTeamLeaderboardTests = async () => {
    const suiteIndex = 3;
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].isRunning = true;
      updated[suiteIndex].tests = [];
      return updated;
    });

    // Create teams with different stats for leaderboard testing
    const team1 = await teamsService.createTeam({
      name: 'Leaderboard Team 1',
      tag: 'LT1',
      description: 'Top performing team',
      color: '#FFD700',
      createdBy: 'leaderboard_owner_1',
      isActive: true,
      isPublic: true,
      maxMembers: 8,
      averageRating: 1800,
      totalRaces: 50,
      wins: 35,
      losses: 15,
      points: 1050,
      ranking: 1,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: false,
        minRating: 0,
        maxMembers: 8,
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#FFD700',
        emblemStyle: 'modern'
      },
      stats: {
        totalRaces: 50,
        totalWins: 35,
        totalLosses: 15,
        totalPoints: 1050,
        averagePosition: 2.1,
        bestPosition: 1,
        winRate: 0.7,
        averageTeamScore: 88.5,
        bestTeamScore: 95.2,
        totalDistance: 1500000,
        totalDuration: 3000000,
        memberContributions: {},
        performance: {
          recentForm: [1, 2, 1, 3, 2, 1, 2, 1, 2, 1],
          momentum: 85,
          consistency: 90,
          improvement: 20,
          streak: 3,
          peakPerformance: 95
        }
      },
      members: [],
      invitations: [],
      raceHistory: []
    });

    const team2 = await teamsService.createTeam({
      name: 'Leaderboard Team 2',
      tag: 'LT2',
      description: 'Second place team',
      color: '#C0C0C0',
      createdBy: 'leaderboard_owner_2',
      isActive: true,
      isPublic: true,
      maxMembers: 8,
      averageRating: 1700,
      totalRaces: 45,
      wins: 25,
      losses: 20,
      points: 750,
      ranking: 2,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: false,
        minRating: 0,
        maxMembers: 8,
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#C0C0C0',
        emblemStyle: 'modern'
      },
      stats: {
        totalRaces: 45,
        totalWins: 25,
        totalLosses: 20,
        totalPoints: 750,
        averagePosition: 2.8,
        bestPosition: 1,
        winRate: 0.556,
        averageTeamScore: 82.1,
        bestTeamScore: 90.1,
        totalDistance: 1350000,
        totalDuration: 2700000,
        memberContributions: {},
        performance: {
          recentForm: [2, 3, 2, 2, 3, 2, 1, 3, 2, 3],
          momentum: 60,
          consistency: 75,
          improvement: 10,
          streak: 1,
          peakPerformance: 88
        }
      },
      members: [],
      invitations: [],
      raceHistory: []
    });

    const tests = [
      await runSingleTest('Get Seasonal Leaderboard', async () => {
        const leaderboard = await teamsService.getTeamLeaderboard('seasonal', 'all_time');
        
        if (!leaderboard) throw new Error('Leaderboard not returned');
        if (leaderboard.teams.length === 0) throw new Error('No teams in leaderboard');
        if (leaderboard.competitionType !== 'seasonal') throw new Error('Wrong competition type');
        if (leaderboard.timeRange !== 'all_time') throw new Error('Wrong time range');
        
        // Verify teams are ranked correctly (by points)
        const sortedTeams = leaderboard.teams.sort((a, b) => b.points - a.points);
        const isCorrectlyRanked = leaderboard.teams.every((team, index) => 
          team.points === sortedTeams[index].points
        );
        
        if (!isCorrectlyRanked) throw new Error('Teams not ranked correctly');
        
        return `Seasonal leaderboard retrieved with ${leaderboard.teams.length} teams`;
      }),

      await runSingleTest('Get Tournament Leaderboard', async () => {
        const leaderboard = await teamsService.getTeamLeaderboard('tournament', 'monthly');
        
        if (!leaderboard) throw new Error('Leaderboard not returned');
        if (leaderboard.competitionType !== 'tournament') throw new Error('Wrong competition type');
        if (leaderboard.timeRange !== 'monthly') throw new Error('Wrong time range');
        
        return `Tournament leaderboard retrieved with ${leaderboard.teams.length} teams`;
      }),

      await runSingleTest('Get Team Ranking', async () => {
        const ranking1 = await teamsService.getTeamRanking(team1.id, 'seasonal', 'all_time');
        const ranking2 = await teamsService.getTeamRanking(team2.id, 'seasonal', 'all_time');
        
        if (ranking1 !== 1) throw new Error('Team 1 should be ranked #1');
        if (ranking2 !== 2) throw new Error('Team 2 should be ranked #2');
        
        return `Team rankings: Team 1 = #${ranking1}, Team 2 = #${ranking2}`;
      }),

      await runSingleTest('Update Team Rankings', async () => {
        // Update rankings
        await teamsService.updateTeamRankings();
        
        // Get updated leaderboard
        const leaderboard = await teamsService.getTeamLeaderboard('seasonal', 'all_time');
        
        if (!leaderboard) throw new Error('Leaderboard not returned after update');
        
        return 'Team rankings updated successfully';
      }),

      await runSingleTest('Create Competition', async () => {
        const competition = await teamsService.createCompetition({
          name: 'Test Championship',
          description: 'A test championship for teams',
          type: 'championship',
          format: 'league',
          maxTeams: 16,
          currentTeams: 0,
          entryFee: 100,
          prizePool: 1600,
          startDate: Date.now() + 86400000, // Tomorrow
          endDate: Date.now() + (86400000 * 30), // 30 days from now
          rules: {
            teamSize: 4,
            minTeams: 8,
            maxTeams: 16,
            raceFormat: 'standard',
            scoringSystem: {
              positionPoints: { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 },
              bonusPoints: {
                fastestLap: 1,
                polePosition: 1,
                mostLapsLed: 1,
                teamBonus: 0
              },
              penalties: {
                dnf: 0,
                dsq: 0,
                lateEntry: 0
              }
            },
            tieBreaker: {
              primary: 'points',
              secondary: 'wins',
              tertiary: 'average_position'
            },
            restrictions: []
          },
          schedule: [],
          rewards: [
            { position: 1, type: 'points', value: 100, description: 'Champion bonus' },
            { position: 2, type: 'points', value: 50, description: 'Runner-up bonus' },
            { position: 3, type: 'points', value: 25, description: 'Third place bonus' }
          ]
        });

        if (!competition.id) throw new Error('Competition ID not generated');
        if (competition.name !== 'Test Championship') throw new Error('Competition name not set');
        if (competition.type !== 'championship') throw new Error('Competition type not set');
        if (competition.status !== 'upcoming') throw new Error('Competition status incorrect');
        
        return `Competition created: ${competition.name} (${competition.id})`;
      }),

      await runSingleTest('Join Competition', async () => {
        // Create a competition
        const competition = await teamsService.createCompetition({
          name: 'Join Test Competition',
          description: 'Competition for testing join functionality',
          type: 'tournament',
          format: 'knockout',
          maxTeams: 8,
          currentTeams: 0,
          startDate: Date.now() + 86400000,
          endDate: Date.now() + (86400000 * 7),
          rules: {
            teamSize: 4,
            minTeams: 4,
            maxTeams: 8,
            raceFormat: 'standard',
            scoringSystem: {
              positionPoints: { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 },
              bonusPoints: {
                fastestLap: 1,
                polePosition: 1,
                mostLapsLed: 1,
                teamBonus: 0
              },
              penalties: {
                dnf: 0,
                dsq: 0,
                lateEntry: 0
              }
            },
            tieBreaker: {
              primary: 'points',
              secondary: 'wins',
              tertiary: 'average_position'
            },
            restrictions: []
          },
          schedule: [],
          rewards: []
        });

        // Change status to registration
        // (In real implementation, this would be handled by the system)
        const joined = await teamsService.joinCompetition(team1.id, competition.id);
        
        if (!joined) throw new Error('Failed to join competition');
        
        return `Team joined competition: ${competition.name}`;
      }),

      await runSingleTest('Get Competitions', async () => {
        const competitions = await teamsService.getCompetitions();
        
        if (!Array.isArray(competitions)) throw new Error('Competitions should be an array');
        
        // Should include the competitions we created
        const hasChampionship = competitions.some(c => c.type === 'championship');
        const hasTournament = competitions.some(c => c.type === 'tournament');
        
        if (!hasChampionship) throw new Error('Should have championship competition');
        if (!hasTournament) throw new Error('Should have tournament competition');
        
        return `Retrieved ${competitions.length} competitions`;
      })
    ];

    // Update test suite results
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex] = {
        ...updated[suiteIndex],
        tests,
        totalTests: tests.length,
        passedTests,
        failedTests,
        totalDuration,
        isRunning: false
      };
      return updated;
    });

    return tests;
  };

  // Team Communication Tests
  const runTeamCommunicationTests = async () => {
    const suiteIndex = 4;
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].isRunning = true;
      updated[suiteIndex].tests = [];
      return updated;
    });

    // Create a team for communication tests
    const team = await teamsService.createTeam({
      name: 'Communication Test Team',
      tag: 'COM',
      description: 'Team for testing communication features',
      color: '#00FF99',
      createdBy: 'comm_owner',
      isActive: true,
      isPublic: true,
      maxMembers: 8,
      averageRating: 1500,
      totalRaces: 0,
      wins: 0,
      losses: 0,
      points: 0,
      ranking: 0,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: false,
        minRating: 0,
        maxMembers: 8,
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#00FF99',
        emblemStyle: 'modern'
      },
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

    // Add members for communication
    await teamsService.joinTeam(team.id, 'comm_member_1');
    await teamsService.joinTeam(team.id, 'comm_member_2');

    const tests = [
      await runSingleTest('Send Team Message', async () => {
        const message = await teamsService.sendTeamMessage(
          team.id,
          'comm_member_1',
          'Hello team! Ready for the race?',
          'text'
        );

        if (!message.id) throw new Error('Message ID not generated');
        if (message.teamId !== team.id) throw new Error('Team ID not set correctly');
        if (message.senderId !== 'comm_member_1') throw new Error('Sender ID not set correctly');
        if (message.message !== 'Hello team! Ready for the race?') throw new Error('Message content not set correctly');
        if (message.type !== 'text') throw new Error('Message type not set correctly');
        
        return `Message sent successfully: ${message.id}`;
      }),

      await runSingleTest('Get Team Chat History', async () => {
        // Send a few messages first
        await teamsService.sendTeamMessage(team.id, 'comm_member_1', 'First message', 'text');
        await teamsService.sendTeamMessage(team.id, 'comm_member_2', 'Second message', 'text');
        await teamsService.sendTeamMessage(team.id, 'comm_member_1', 'Third message', 'text');

        // Get chat history
        const chatHistory = await teamsService.getTeamChat(team.id, 10);
        
        if (!Array.isArray(chatHistory)) throw new Error('Chat history should be an array');
        if (chatHistory.length < 3) throw new Error('Should have at least 3 messages');
        if (chatHistory.length > 10) throw new Error('Should not exceed limit of 10');
        
        // Verify messages are in chronological order (newest first)
        const timestamps = chatHistory.map(m => m.timestamp);
        const isChronological = timestamps.every((timestamp, index) => 
          index === 0 || timestamp <= timestamps[index - 1]
        );
        
        if (!isChronological) throw new Error('Messages not in chronological order');
        
        return `Chat history retrieved with ${chatHistory.length} messages`;
      }),

      await runSingleTest('Delete Team Message', async () => {
        // Send a message
        const message = await teamsService.sendTeamMessage(
          team.id,
          'comm_member_1',
          'This message will be deleted',
          'text'
        );

        // Delete the message
        const deleted = await teamsService.deleteMessage(message.id, 'comm_member_1');
        
        if (!deleted) throw new Error('Message deletion failed');
        
        // Verify message is no longer in chat
        const chatHistory = await teamsService.getTeamChat(team.id);
        const deletedMessage = chatHistory.find(m => m.id === message.id);
        
        if (deletedMessage) throw new Error('Deleted message should not be in chat');
        
        return 'Message deleted successfully';
      }),

      await runSingleTest('React to Message', async () => {
        // Send a message
        const message = await teamsService.sendTeamMessage(
          team.id,
          'comm_member_1',
          'React to this message!',
          'text'
        );

        // Add reaction
        const reacted = await teamsService.reactToMessage(message.id, 'comm_member_2', '👍');
        
        if (!reacted) throw new Error('Message reaction failed');
        
        // Add another reaction
        const reacted2 = await teamsService.reactToMessage(message.id, 'comm_member_1', '🎉');
        
        if (!reacted2) throw new Error('Second reaction failed');
        
        // Verify reactions
        const chatHistory = await teamsService.getTeamChat(team.id);
        const updatedMessage = chatHistory.find(m => m.id === message.id);
        
        if (!updatedMessage) throw new Error('Message not found');
        if (updatedMessage.reactions.length !== 2) throw new Error('Should have 2 reactions');
        
        const thumbsUpReaction = updatedMessage.reactions.find(r => r.emoji === '👍');
        const partyReaction = updatedMessage.reactions.find(r => r.emoji === '🎉');
        
        if (!thumbsUpReaction || !partyReaction) throw new Error('Reactions not found');
        if (thumbsUpReaction.users.length !== 1) throw new Error('Thumbs up reaction user count incorrect');
        if (partyReaction.users.length !== 1) throw new Error('Party reaction user count incorrect');
        
        return 'Message reactions added successfully';
      }),

      await runSingleTest('Send System Message', async () => {
        const message = await teamsService.sendTeamMessage(
          team.id,
          'system',
          'Team practice session starting in 5 minutes',
          'system'
        );

        if (message.type !== 'system') throw new Error('Message type should be system');
        if (message.senderId !== 'system') throw new Error('Sender ID should be system');
        
        return 'System message sent successfully';
      }),

      await runSingleTest('Send Achievement Message', async () => {
        const message = await teamsService.sendTeamMessage(
          team.id,
          'system',
          '🏆 Team unlocked: First Victory!',
          'achievement'
        );

        if (message.type !== 'achievement') throw new Error('Message type should be achievement');
        if (!message.message.includes('🏆')) throw new Error('Achievement message should have trophy emoji');
        
        return 'Achievement message sent successfully';
      })
    ];

    // Update test suite results
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex] = {
        ...updated[suiteIndex],
        tests,
        totalTests: tests.length,
        passedTests,
        failedTests,
        totalDuration,
        isRunning: false
      };
      return updated;
    });

    return tests;
  };

  // Team Statistics Tests
  const runTeamStatisticsTests = async () => {
    const suiteIndex = 5;
    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex].isRunning = true;
      updated[suiteIndex].tests = [];
      return updated;
    });

    // Create a team for statistics tests
    const team = await teamsService.createTeam({
      name: 'Statistics Test Team',
      tag: 'STAT',
      description: 'Team for testing statistics and analytics',
      color: '#FF6600',
      createdBy: 'stats_owner',
      isActive: true,
      isPublic: true,
      maxMembers: 8,
      averageRating: 1500,
      totalRaces: 25,
      wins: 15,
      losses: 10,
      points: 450,
      ranking: 3,
      achievements: [],
      settings: {
        allowInvites: true,
        requireApproval: false,
        minRating: 0,
        maxMembers: 8,
        teamChat: true,
        voiceChat: false,
        privateRaces: false,
        autoAcceptInvites: false,
        teamColor: '#FF6600',
        emblemStyle: 'modern'
      },
      stats: {
        totalRaces: 25,
        totalWins: 15,
        totalLosses: 10,
        totalPoints: 450,
        averagePosition: 2.8,
        bestPosition: 1,
        winRate: 0.6,
        averageTeamScore: 75.5,
        bestTeamScore: 88.2,
        totalDistance: 750000,
        totalDuration: 1500000,
        memberContributions: {
          'stats_member_1': 150,
          'stats_member_2': 120,
          'stats_member_3': 100
        },
        performance: {
          recentForm: [2, 3, 1, 2, 4, 2, 1, 3, 2, 1],
          momentum: 55,
          consistency: 70,
          improvement: 15,
          streak: 2,
          peakPerformance: 85
        }
      },
      members: [],
      invitations: [],
      raceHistory: []
    });

    const tests = [
      await runSingleTest('Get Team Statistics', async () => {
        const stats = await teamsService.getTeamStats(team.id);
        
        if (!stats) throw new Error('Team stats not returned');
        if (stats.totalRaces !== 25) throw new Error('Total races incorrect');
        if (stats.totalWins !== 15) throw new Error('Total wins incorrect');
        if (stats.totalLosses !== 10) throw new Error('Total losses incorrect');
        if (stats.winRate !== 0.6) throw new Error('Win rate incorrect');
        if (stats.averagePosition !== 2.8) throw new Error('Average position incorrect');
        if (stats.bestPosition !== 1) throw new Error('Best position incorrect');
        
        return 'Team statistics retrieved successfully';
      }),

      await runSingleTest('Get Member Statistics', async () => {
        // Add a member first
        await teamsService.joinTeam(team.id, 'stats_member_test');
        
        const memberStats = await teamsService.getMemberStats(team.id, 'stats_member_test');
        
        if (!memberStats) throw new Error('Member stats not returned');
        if (memberStats.individualRaces !== 0) throw new Error('Individual races should be 0');
        if (memberStats.teamRaces !== 0) throw new Error('Team races should be 0');
        if (memberStats.contributionScore !== 0) throw new Error('Contribution score should be 0');
        
        return 'Member statistics retrieved successfully';
      }),

      await runSingleTest('Update Team Stats After Race', async () => {
        // Simulate a race result
        const raceResult = {
          id: 'race_1',
          raceId: 'test_race_1',
          raceName: 'Test Race',
          date: Date.now(),
          position: 2,
          points: 18,
          participants: ['stats_member_1', 'stats_member_2'],
          totalTeams: 4,
          duration: 1800000,
          bestLap: 65000,
          averagePosition: 2.5,
          teamScore: 82.5,
          result: 'loss' as const
        };

        // Update team stats
        await teamsService.updateTeamStats(team.id, raceResult);
        
        // Verify stats were updated
        const updatedStats = await teamsService.getTeamStats(team.id);
        
        if (updatedStats.totalRaces !== 26) throw new Error('Total races should be 26');
        if (updatedStats.totalPoints !== 468) throw new Error('Total points should be 468');
        if (updatedStats.totalLosses !== 11) throw new Error('Total losses should be 11');
        
        return 'Team stats updated after race';
      }),

      await runSingleTest('Get Team Performance', async () => {
        const performance = await teamsService.getTeamPerformance(team.id);
        
        if (!performance) throw new Error('Team performance not returned');
        if (!Array.isArray(performance.recentForm)) throw new Error('Recent form should be an array');
        if (performance.recentForm.length !== 10) throw new Error('Recent form should have 10 entries');
        if (performance.momentum < 0 || performance.momentum > 100) throw new Error('Momentum out of range');
        if (performance.consistency < 0 || performance.consistency > 100) throw new Error('Consistency out of range');
        if (performance.streak < -10 || performance.streak > 10) throw new Error('Streak out of range');
        
        return 'Team performance retrieved successfully';
      }),

      await runSingleTest('Unlock Achievement', async () => {
        const achievement = await teamsService.unlockAchievement(team.id, 'first_win');
        
        if (!achievement.id) throw new Error('Achievement ID not set');
        if (achievement.name !== 'First Victory') throw new Error('Achievement name incorrect');
        if (achievement.unlockedAt <= 0) throw new Error('Unlock time not set');
        if (achievement.points !== 10) throw new Error('Achievement points incorrect');
        
        // Verify achievement is in team's achievements
        const teamAchievements = await teamsService.getTeamAchievements(team.id);
        const unlockedAchievement = teamAchievements.find(a => a.id === 'first_win');
        
        if (!unlockedAchievement) throw new Error('Achievement not found in team achievements');
        
        return 'Achievement unlocked successfully';
      }),

      await runSingleTest('Check Achievements', async () => {
        // Unlock some achievements
        await teamsService.unlockAchievement(team.id, 'teamwork_master');
        await teamsService.unlockAchievement(team.id, 'dominant_force');
        
        const achievements = await teamsService.checkAchievements(team.id);
        
        if (!Array.isArray(achievements)) throw new Error('Achievements should be an array');
        if (achievements.length === 0) throw new Error('Should have unlocked achievements');
        
        // Verify the achievements we just unlocked
        const hasFirstWin = achievements.some(a => a.id === 'first_win');
        const hasTeamworkMaster = achievements.some(a => a.id === 'teamwork_master');
        const hasDominantForce = achievements.some(a => a.id === 'dominant_force');
        
        if (!hasFirstWin || !hasTeamworkMaster || !hasDominantForce) {
          throw new Error('Expected achievements not found');
        }
        
        return `Checked and unlocked ${achievements.length} achievements`;
      }),

      await runSingleTest('Get Team Analytics', async () => {
        const analytics = await teamsService.getTeamAnalytics(team.id);
        
        if (!analytics) throw new Error('Team analytics not returned');
        if (!analytics.performance) throw new Error('Performance data missing');
        if (!analytics.communication) throw new Error('Communication data missing');
        if (!analytics.achievements) throw new Error('Achievements data missing');
        
        if (analytics.achievements.unlocked !== 3) throw new Error('Unlocked achievements count incorrect');
        if (analytics.achievements.total !== 6) throw new Error('Total achievements count incorrect');
        if (analytics.achievements.progress !== 50) throw new Error('Achievement progress incorrect');
        
        return 'Team analytics retrieved successfully';
      }),

      await runSingleTest('Get Global Team Stats', async () => {
        const globalStats = await teamsService.getGlobalTeamStats();
        
        if (!globalStats) throw new Error('Global stats not returned');
        if (globalStats.totalTeams < 1) throw new Error('Should have at least 1 team');
        if (globalStats.activeTeams < 1) throw new Error('Should have at least 1 active team');
        if (globalStats.averageRating < 0) throw new Error('Average rating should be positive');
        if (!Array.isArray(globalStats.topTeams)) throw new Error('Top teams should be an array');
        
        return `Global stats retrieved: ${globalStats.totalTeams} total teams`;
      }),

      await runSingleTest('Get Competition Analytics', async () => {
        // Create a competition
        const competition = await teamsService.createCompetition({
          name: 'Analytics Test Competition',
          description: 'Competition for testing analytics',
          type: 'tournament',
          format: 'knockout',
          maxTeams: 8,
          currentTeams: 2,
          startDate: Date.now() + 86400000,
          endDate: Date.now() + (86400000 * 7),
          rules: {
            teamSize: 4,
            minTeams: 4,
            maxTeams: 8,
            raceFormat: 'standard',
            scoringSystem: {
              positionPoints: { 1: 25, 2: 18, 3: 15, 4: 12, 5: 10, 6: 8, 7: 6, 8: 4, 9: 2, 10: 1 },
              bonusPoints: {
                fastestLap: 1,
                polePosition: 1,
                mostLapsLed: 1,
                teamBonus: 0
              },
              penalties: {
                dnf: 0,
                dsq: 0,
                lateEntry: 0
              }
            },
            tieBreaker: {
              primary: 'points',
              secondary: 'wins',
              tertiary: 'average_position'
            },
            restrictions: []
          },
          schedule: [],
          rewards: []
        });

        const analytics = await teamsService.getCompetitionAnalytics(competition.id);
        
        if (!analytics) throw new Error('Competition analytics not returned');
        if (analytics.teamCount !== 2) throw new Error('Team count incorrect');
        if (analytics.engagement.activeTeams !== 2) throw new Error('Active teams count incorrect');
        
        return 'Competition analytics retrieved successfully';
      })
    ];

    // Update test suite results
    const passedTests = tests.filter(t => t.status === 'passed').length;
    const failedTests = tests.filter(t => t.status === 'failed').length;
    const totalDuration = tests.reduce((sum, t) => sum + t.duration, 0);

    setTestSuites(prev => {
      const updated = [...prev];
      updated[suiteIndex] = {
        ...updated[suiteIndex],
        tests,
        totalTests: tests.length,
        passedTests,
        failedTests,
        totalDuration,
        isRunning: false
      };
      return updated;
    });

    return tests;
  };

  const runAllTests = async () => {
    setIsRunningAll(true);
    
    try {
      await runTeamCreationTests();
      await runTeamInvitationTests();
      await runTeamManagementTests();
      await runTeamLeaderboardTests();
      await runTeamCommunicationTests();
      await runTeamStatisticsTests();
    } finally {
      setIsRunningAll(false);
    }
  };

  const runSingleSuite = async (suiteIndex: number) => {
    switch (suiteIndex) {
      case 0:
        await runTeamCreationTests();
        break;
      case 1:
        await runTeamInvitationTests();
        break;
      case 2:
        await runTeamManagementTests();
        break;
      case 3:
        await runTeamLeaderboardTests();
        break;
      case 4:
        await runTeamCommunicationTests();
        break;
      case 5:
        await runTeamStatisticsTests();
        break;
    }
  };

  const getOverallStats = () => {
    const totalTests = testSuites.reduce((sum, suite) => sum + suite.totalTests, 0);
    const totalPassed = testSuites.reduce((sum, suite) => sum + suite.passedTests, 0);
    const totalFailed = testSuites.reduce((sum, suite) => sum + suite.failedTests, 0);
    const totalDuration = testSuites.reduce((sum, suite) => sum + suite.totalDuration, 0);
    
    return {
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      successRate: totalTests > 0 ? (totalPassed / totalTests) * 100 : 0
    };
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'running': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      default: return '⏸';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Team-Based Racing E2E Tests</h1>
          <p className="text-gray-400">Comprehensive end-to-end testing for team functionality</p>
        </div>

        {/* Overall Statistics */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{getOverallStats().totalTests}</div>
              <div className="text-sm text-gray-400">Total Tests</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{getOverallStats().totalPassed}</div>
              <div className="text-sm text-gray-400">Passed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-500">{getOverallStats().totalFailed}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">{getOverallStats().successRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
          </div>
          <div className="mt-4 text-center text-sm text-gray-400">
            Total Duration: {formatDuration(getOverallStats().totalDuration)}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={runAllTests}
            disabled={isRunningAll}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunningAll ? 'Running All Tests...' : 'Run All Tests'}
          </button>
          <button
            onClick={() => {
              setTestSuites(testSuites.map(suite => ({
                ...suite,
                tests: [],
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                totalDuration: 0,
                isRunning: false
              })));
            }}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium"
          >
            Clear Results
          </button>
        </div>

        {/* Test Suites */}
        <div className="space-y-6">
          {testSuites.map((suite, index) => (
            <div key={index} className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{suite.name}</h2>
                  <p className="text-gray-400 text-sm">{suite.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-gray-400">
                      {suite.passedTests}/{suite.totalTests} passed
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDuration(suite.totalDuration)}
                    </div>
                  </div>
                  {!suite.isRunning && (
                    <button
                      onClick={() => runSingleSuite(index)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium"
                    >
                      Run Suite
                    </button>
                  )}
                  {suite.isRunning && (
                    <div className="px-4 py-2 bg-gray-700 rounded-lg text-sm font-medium">
                      Running...
                    </div>
                  )}
                </div>
              </div>

              {/* Test Results */}
              <div className="space-y-2">
                {suite.tests.length === 0 && !suite.isRunning && (
                  <div className="text-center py-8 text-gray-500">
                    No tests run yet
                  </div>
                )}
                
                {suite.tests.map((test, testIndex) => (
                  <div
                    key={testIndex}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className={getStatusColor(test.status)}>
                        {getStatusIcon(test.status)}
                      </span>
                      <span className="font-medium">{test.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-400">
                        {formatDuration(test.duration)}
                      </span>
                      {test.error && (
                        <span className="text-xs text-red-400 max-w-xs truncate">
                          {test.error}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
