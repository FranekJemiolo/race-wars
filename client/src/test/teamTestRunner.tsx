/**
 * Team Test Runner Interface
 * 
 * Interactive test runner for team-based racing system with live results and detailed reporting
 */

import { useState, useEffect } from 'react';
import { TeamE2ETests } from './teamE2ETests';

interface TestSession {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  results: any[];
}

interface TestReport {
  sessionId: string;
  timestamp: number;
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    totalDuration: number;
    successRate: number;
  };
  details: any[];
  recommendations: string[];
}

export const TeamTestRunner: React.FC = () => {
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [testHistory, setTestHistory] = useState<TestSession[]>([]);
  const [currentReport, setCurrentReport] = useState<TestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [testProgress, setTestProgress] = useState({
    current: 0,
    total: 0,
    currentTest: ''
  });

  const availableTests = [
    'Team Creation Tests',
    'Team Invitation Tests', 
    'Team Management Tests',
    'Team Leaderboard Tests',
    'Team Communication Tests',
    'Team Statistics Tests'
  ];

  useEffect(() => {
    // Load test history from localStorage
    const savedHistory = localStorage.getItem('teamTestHistory');
    if (savedHistory) {
      setTestHistory(JSON.parse(savedHistory));
    }
  }, []);

  const startTestSession = async () => {
    const sessionId = `session_${Date.now()}`;
    const session: TestSession = {
      id: sessionId,
      name: `Test Session ${new Date().toLocaleString()}`,
      startTime: Date.now(),
      status: 'running',
      results: []
    };

    setActiveSession(session);
    setIsRunning(true);
    setTestProgress({ current: 0, total: selectedTests.length, currentTest: '' });

    try {
      // Run selected tests (mock implementation for demo)
      for (let i = 0; i < selectedTests.length; i++) {
        const testName = selectedTests[i];
        setTestProgress(prev => ({
          ...prev,
          current: i + 1,
          currentTest: testName
        }));

        // Simulate test execution
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result = {
          name: testName,
          status: Math.random() > 0.2 ? 'passed' : 'failed',
          duration: 1500 + Math.random() * 1000,
          error: Math.random() > 0.2 ? null : 'Mock test failure for demonstration',
          details: `Test ${testName} completed successfully`
        };

        session.results.push(result);
      }

      session.status = 'completed';
      session.endTime = Date.now();

      // Generate report
      const report = generateTestReport(session);
      setCurrentReport(report);

      // Save to history
      const updatedHistory = [...testHistory, session];
      setTestHistory(updatedHistory);
      localStorage.setItem('teamTestHistory', JSON.stringify(updatedHistory));

    } catch (error) {
      session.status = 'failed';
      session.endTime = Date.now();
    } finally {
      setActiveSession(session);
      setIsRunning(false);
      setTestProgress({ current: 0, total: 0, currentTest: '' });
    }
  };

  const generateTestReport = (session: TestSession): TestReport => {
    const totalTests = session.results.length;
    const passedTests = session.results.filter(r => r.status === 'passed').length;
    const failedTests = session.results.filter(r => r.status === 'failed').length;
    const skippedTests = 0;
    const totalDuration = session.endTime! - session.startTime;
    const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    const recommendations: string[] = [];
    
    if (successRate < 80) {
      recommendations.push('Review failed tests and fix underlying issues');
    }
    if (failedTests > 0) {
      recommendations.push('Focus on test reliability and error handling');
    }
    if (totalDuration > 30000) {
      recommendations.push('Consider optimizing test performance');
    }
    if (successRate === 100) {
      recommendations.push('Excellent test coverage! Consider adding edge cases');
    }

    return {
      sessionId: session.id,
      timestamp: Date.now(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        totalDuration,
        successRate
      },
      details: session.results,
      recommendations
    };
  };

  const toggleTestSelection = (testName: string) => {
    setSelectedTests(prev => {
      if (prev.includes(testName)) {
        return prev.filter(t => t !== testName);
      } else {
        return [...prev, testName];
      }
    });
  };

  const selectAllTests = () => {
    setSelectedTests(availableTests);
  };

  const clearSelection = () => {
    setSelectedTests([]);
  };

  const deleteSession = (sessionId: string) => {
    const updatedHistory = testHistory.filter(session => session.id !== sessionId);
    setTestHistory(updatedHistory);
    localStorage.setItem('teamTestHistory', JSON.stringify(updatedHistory));
    
    if (currentReport?.sessionId === sessionId) {
      setCurrentReport(null);
    }
  };

  const exportReport = (report: TestReport) => {
    const reportData = {
      ...report,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `team-test-report-${report.sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      case 'completed': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '⏳';
      case 'completed': return '🎉';
      case 'failed': return '💥';
      default: return '⏸';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Team Test Runner</h1>
          <p className="text-gray-400">Interactive test execution and reporting for team-based racing</p>
        </div>

        {/* Test Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Test Selection</h2>
            <div className="flex gap-2">
              <button
                onClick={selectAllTests}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableTests.map((test) => (
              <label
                key={test}
                className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600"
              >
                <input
                  type="checkbox"
                  checked={selectedTests.includes(test)}
                  onChange={() => toggleTestSelection(test)}
                  className="w-4 h-4"
                />
                <span className="text-sm">{test}</span>
              </label>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {selectedTests.length} of {availableTests.length} tests selected
            </div>
            <button
              onClick={startTestSession}
              disabled={isRunning || selectedTests.length === 0}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRunning ? 'Running Tests...' : 'Run Selected Tests'}
            </button>
          </div>
        </div>

        {/* Current Session Progress */}
        {activeSession && isRunning && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Test Progress</h2>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span>{testProgress.currentTest || 'Initializing...'}</span>
                <span>{testProgress.current}/{testProgress.total}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${testProgress.total > 0 ? (testProgress.current / testProgress.total) * 100 : 0}%`
                  }}
                />
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Session started: {new Date(activeSession.startTime).toLocaleTimeString()}
            </div>
          </div>
        )}

        {/* Latest Test Report */}
        {currentReport && (
          <div className="bg-gray-800 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Latest Test Report</h2>
              <button
                onClick={() => exportReport(currentReport)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm"
              >
                Export Report
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{currentReport.summary.totalTests}</div>
                <div className="text-sm text-gray-400">Total Tests</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-500">{currentReport.summary.passedTests}</div>
                <div className="text-sm text-gray-400">Passed</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-500">{currentReport.summary.failedTests}</div>
                <div className="text-sm text-gray-400">Failed</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-500">{currentReport.summary.successRate.toFixed(1)}%</div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>

            {/* Test Details */}
            <div className="mb-6">
              <h3 className="font-semibold mb-3">Test Results</h3>
              <div className="space-y-2">
                {currentReport.details.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
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

            {/* Recommendations */}
            {currentReport.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Recommendations</h3>
                <div className="space-y-2">
                  {currentReport.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start gap-2 p-3 bg-gray-700 rounded-lg">
                      <span className="text-blue-400 mt-1">💡</span>
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Test History */}
        {testHistory.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Test History</h2>
            <div className="space-y-3">
              {testHistory.slice(-5).reverse().map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className={getStatusColor(session.status)}>
                      {getStatusIcon(session.status)}
                    </span>
                    <div>
                      <div className="font-medium">{session.name}</div>
                      <div className="text-sm text-gray-400">
                        {session.results.length} tests • {formatDuration(session.endTime! - session.startTime)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {new Date(session.startTime).toLocaleString()}
                    </span>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full E2E Test Component */}
        <div className="mt-8">
          <div className="bg-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-4">Complete E2E Test Suite</h2>
            <p className="text-gray-400 mb-4">Full comprehensive test suite with detailed validation</p>
            <div className="bg-gray-900 rounded-lg p-4">
              <TeamE2ETests />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
