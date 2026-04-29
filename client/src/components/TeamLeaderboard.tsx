import React, { useState, useEffect } from 'react';
import { getTeamRacingService, TeamLeaderboard, CompetitionType, TimeRange, TeamCompetition } from '../services/teamRacing.service';

interface TeamLeaderboardProps {
  userId: string;
  className?: string;
}

export const TeamLeaderboard: React.FC<TeamLeaderboardProps> = ({ userId, className = '' }) => {
  const teamsService = getTeamRacingService();
  
  const [leaderboard, setLeaderboard] = useState<TeamLeaderboard | null>(null);
  const [competitions, setCompetitions] = useState<TeamCompetition[]>([]);
  const [selectedCompetition, setSelectedCompetition] = useState<TeamCompetition | null>(null);
  const [competitionType, setCompetitionType] = useState<CompetitionType>('seasonal');
  const [timeRange, setTimeRange] = useState<TimeRange>('all_time');
  const [isLoading, setIsLoading] = useState(false);
  const [showCompetitionDetails, setShowCompetitionDetails] = useState(false);
  const [userTeamRank, setUserTeamRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
    loadCompetitions();
  }, [competitionType, timeRange]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    try {
      const data = await teamsService.getTeamLeaderboard(competitionType, timeRange);
      setLeaderboard(data);
      
      // Find user's team ranking
      if (data.teams.length > 0) {
        const userTeams = await teamsService.getUserTeams(userId);
        if (userTeams.length > 0) {
          const userTeamId = userTeams[0].id; // Use first team for demo
          const ranking = await teamsService.getTeamRanking(userTeamId, competitionType, timeRange);
          setUserTeamRank(ranking > 0 ? ranking : null);
        }
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCompetitions = async () => {
    try {
      const data = await teamsService.getCompetitions();
      setCompetitions(data.filter(comp => comp.status === 'active' || comp.status === 'registration'));
    } catch (error) {
      console.error('Failed to load competitions:', error);
    }
  };

  const handleJoinCompetition = async (competitionId: string) => {
    try {
      const userTeams = await teamsService.getUserTeams(userId);
      if (userTeams.length === 0) {
        alert('You need to join a team first');
        return;
      }

      const joined = await teamsService.joinCompetition(userTeams[0].id, competitionId);
      if (joined) {
        alert('Successfully joined the competition!');
        loadCompetitions();
      } else {
        alert('Failed to join competition');
      }
    } catch (error) {
      console.error('Failed to join competition:', error);
      alert('Failed to join competition');
    }
  };

  const getRankChangeIcon = (change: number): string => {
    if (change > 0) return '📈';
    if (change < 0) return '📉';
    return '➡️';
  };

  const getRankChangeColor = (change: number): string => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-400';
  };

  const getCompetitionTypeColor = (type: CompetitionType): string => {
    switch (type) {
      case 'seasonal': return 'bg-blue-600';
      case 'tournament': return 'bg-purple-600';
      case 'championship': return 'bg-yellow-600';
      case 'friendly': return 'bg-green-600';
      case 'ranked': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getCompetitionStatusColor = (status: string): string => {
    switch (status) {
      case 'active': return 'bg-green-600';
      case 'registration': return 'bg-blue-600';
      case 'upcoming': return 'bg-yellow-600';
      case 'completed': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const formatTimeRange = (range: TimeRange): string => {
    switch (range) {
      case 'daily': return 'Today';
      case 'weekly': return 'This Week';
      case 'monthly': return 'This Month';
      case 'seasonal': return 'This Season';
      case 'all_time': return 'All Time';
      default: return 'All Time';
    }
  };

  const LeaderboardEntry: React.FC<{ entry: any; isUserTeam?: boolean }> = ({ entry, isUserTeam = false }) => (
    <div className={`flex items-center justify-between p-4 rounded-lg ${
      isUserTeam ? 'bg-blue-900 border border-blue-500' : 'bg-gray-800'
    }`}>
      <div className="flex items-center gap-4">
        <div className="text-center min-w-[3rem]">
          <div className={`text-2xl font-bold ${isUserTeam ? 'text-blue-400' : 'text-white'}`}>
            {entry.rank}
          </div>
          {entry.change !== 0 && (
            <div className={`text-xs ${getRankChangeColor(entry.change)}`}>
              {getRankChangeIcon(entry.change)} {Math.abs(entry.change)}
            </div>
          )}
        </div>

        <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
             style={{ backgroundColor: entry.team.color }}>
          {entry.team.tag}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold ${isUserTeam ? 'text-blue-400' : 'text-white'}`}>
            {entry.team.name}
          </h3>
          <p className="text-sm text-gray-400">
            {entry.team.currentMembers} members • Rating: {Math.round(entry.team.averageRating)}
          </p>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xl font-bold text-white">{entry.points}</div>
        <p className="text-xs text-gray-400">Points</p>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-white">
          {(entry.winRate * 100).toFixed(1)}%
        </div>
        <p className="text-xs text-gray-400">Win Rate</p>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-white">{entry.wins}</div>
        <p className="text-xs text-gray-400">Wins</p>
      </div>

      <div className="text-right">
        <div className="text-lg font-semibold text-white">
          {entry.averagePosition.toFixed(1)}
        </div>
        <p className="text-xs text-gray-400">Avg Pos</p>
      </div>
    </div>
  );

  const CompetitionCard: React.FC<{ competition: TeamCompetition }> = ({ competition }) => (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{competition.name}</h3>
          <p className="text-sm text-gray-400">{competition.description}</p>
        </div>
        <div className="text-right">
          <span className={`px-2 py-1 rounded text-xs ${getCompetitionTypeColor(competition.type)}`}>
            {competition.type}
          </span>
          <span className={`px-2 py-1 rounded text-xs mt-1 block ${getCompetitionStatusColor(competition.status)}`}>
            {competition.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm mb-4">
        <div>
          <span className="text-gray-400">Teams:</span>
          <span className="ml-2 font-medium">{competition.currentTeams}/{competition.maxTeams}</span>
        </div>
        <div>
          <span className="text-gray-400">Entry Fee:</span>
          <span className="ml-2 font-medium">{competition.entryFee || 'Free'}</span>
        </div>
        <div>
          <span className="text-gray-400">Prize Pool:</span>
          <span className="ml-2 font-medium">{competition.prizePool || 'N/A'}</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => {
            setSelectedCompetition(competition);
            setShowCompetitionDetails(true);
          }}
          className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm touch-manipulation"
        >
          View Details
        </button>
        {competition.status === 'registration' && (
          <button
            onClick={() => handleJoinCompetition(competition.id)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm touch-manipulation"
          >
            Join
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className={`team-leaderboard bg-gray-900 text-white ${className}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Team Leaderboard</h1>
            <p className="text-gray-400">Compete with the best racing teams</p>
          </div>
          
          {userTeamRank && (
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">#{userTeamRank}</div>
              <p className="text-sm text-gray-400">Your Team Rank</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => setCompetitionType('seasonal')}
              className={`px-4 py-2 rounded-lg text-sm ${
                competitionType === 'seasonal' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Seasonal
            </button>
            <button
              onClick={() => setCompetitionType('tournament')}
              className={`px-4 py-2 rounded-lg text-sm ${
                competitionType === 'tournament' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Tournament
            </button>
            <button
              onClick={() => setCompetitionType('championship')}
              className={`px-4 py-2 rounded-lg text-sm ${
                competitionType === 'championship' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Championship
            </button>
            <button
              onClick={() => setCompetitionType('friendly')}
              className={`px-4 py-2 rounded-lg text-sm ${
                competitionType === 'friendly' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Friendly
            </button>
            <button
              onClick={() => setCompetitionType('ranked')}
              className={`px-4 py-2 rounded-lg text-sm ${
                competitionType === 'ranked' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Ranked
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setTimeRange('daily')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeRange === 'daily' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeRange === 'weekly' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeRange === 'monthly' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeRange('all_time')}
              className={`px-4 py-2 rounded-lg text-sm ${
                timeRange === 'all_time' ? 'bg-blue-600' : 'bg-gray-700'
              }`}
            >
              All Time
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-gray-400">Competition:</span>
            <span className="ml-2 font-medium capitalize">{competitionType}</span>
          </div>
          <div>
            <span className="text-gray-400">Time Range:</span>
            <span className="ml-2 font-medium">{formatTimeRange(timeRange)}</span>
          </div>
          {leaderboard && (
            <div>
              <span className="text-gray-400">Total Teams:</span>
              <span className="ml-2 font-medium">{leaderboard.totalTeams}</span>
            </div>
          )}
          {leaderboard && (
            <div>
              <span className="text-gray-400">Last Updated:</span>
              <span className="ml-2 font-medium">
                {new Date(leaderboard.lastUpdated).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Active Competitions */}
        {competitions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Active Competitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {competitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} />
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {competitionType} Leaderboard - {formatTimeRange(timeRange)}
          </h2>
          
          {isLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 animate-spin">🏁</div>
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : leaderboard && leaderboard.teams.length > 0 ? (
            <div className="space-y-2">
              {/* Header */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg text-sm font-semibold text-gray-400">
                <div className="flex items-center gap-4 min-w-[3rem]">Rank</div>
                <div className="flex-1">Team</div>
                <div className="text-right min-w-[4rem]">Points</div>
                <div className="text-right min-w-[4rem]">Win Rate</div>
                <div className="text-right min-w-[3rem]">Wins</div>
                <div className="text-right min-w-[4rem]">Avg Pos</div>
              </div>

              {/* Entries */}
              {leaderboard.teams.map((entry, index) => {
                const userTeams = userTeamRank ? [userTeamRank] : [];
                const isUserTeam = userTeamRank && entry.rank === userTeamRank;
                
                return (
                  <LeaderboardEntry 
                    key={entry.team.id} 
                    entry={entry} 
                    isUserTeam={isUserTeam}
                  />
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏆</div>
              <p className="text-gray-400">No teams found for this competition type</p>
            </div>
          )}
        </div>
      </div>

      {/* Competition Details Modal */}
      {showCompetitionDetails && selectedCompetition && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">{selectedCompetition.name}</h3>
              <button
                onClick={() => setShowCompetitionDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-300">{selectedCompetition.description}</p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-400">Type:</span>
                  <span className="ml-2 capitalize">{selectedCompetition.type}</span>
                </div>
                <div>
                  <span className="text-gray-400">Format:</span>
                  <span className="ml-2 capitalize">{selectedCompetition.format}</span>
                </div>
                <div>
                  <span className="text-gray-400">Teams:</span>
                  <span className="ml-2">{selectedCompetition.currentTeams}/{selectedCompetition.maxTeams}</span>
                </div>
                <div>
                  <span className="text-gray-400">Status:</span>
                  <span className="ml-2 capitalize">{selectedCompetition.status}</span>
                </div>
                <div>
                  <span className="text-gray-400">Start Date:</span>
                  <span className="ml-2">{new Date(selectedCompetition.startDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="text-gray-400">End Date:</span>
                  <span className="ml-2">{new Date(selectedCompetition.endDate).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedCompetition.entryFee && (
                <div>
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="ml-2">{selectedCompetition.entryFee}</span>
                </div>
              )}

              {selectedCompetition.prizePool && (
                <div>
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="ml-2">{selectedCompetition.prizePool}</span>
                </div>
              )}

              {/* Competition Leaderboard */}
              <div>
                <h4 className="font-semibold mb-2">Current Standings</h4>
                <div className="space-y-2">
                  {selectedCompetition.leaderboard.teams.slice(0, 5).map((entry, index) => (
                    <div key={entry.team.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-xs font-bold">
                          {entry.rank}
                        </div>
                        <div 
                          className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: entry.team.color }}
                        >
                          {entry.team.tag}
                        </div>
                        <span className="font-medium">{entry.team.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{entry.points}</div>
                        <div className="text-xs text-gray-400">pts</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                {selectedCompetition.status === 'registration' && (
                  <button
                    onClick={() => {
                      handleJoinCompetition(selectedCompetition.id);
                      setShowCompetitionDetails(false);
                    }}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium touch-manipulation"
                  >
                    Join Competition
                  </button>
                )}
                <button
                  onClick={() => setShowCompetitionDetails(false)}
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
