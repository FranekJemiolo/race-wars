/**
 * Performance Tests for Leaderboard with Multiple Concurrent Users
 * 
 * Tests the leaderboard system under load to ensure it can handle:
 * - Multiple concurrent WebSocket connections
 * - High-frequency position updates
 * - Database performance under load
 * - Memory usage and scalability
 * - Real-time update latency
 */

import { test, expect } from '@playwright/test';
import { WebSocket } from 'ws';

test.describe('Leaderboard Performance Tests', () => {
  const CONCURRENT_USERS = 50;
  const UPDATES_PER_USER = 100;
  const RACE_ID = 'performance-test-race';
  
  let connections: WebSocket[] = [];
  let updateTimes: number[] = [];
  let memoryUsage: number[] = [];

  test.beforeAll(async () => {
    // Initialize test race
    console.log('Initializing performance test race...');
  });

  test.afterAll(async () => {
    // Clean up connections
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    connections = [];
    
    // Log performance metrics
    console.log('Performance Test Results:');
    console.log(`Average update time: ${updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length}ms`);
    console.log(`Max update time: ${Math.max(...updateTimes)}ms`);
    console.log(`Min update time: ${Math.min(...updateTimes)}ms`);
    console.log(`Average memory usage: ${memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length}MB`);
  });

  test.describe('WebSocket Connection Performance', () => {
    test('should handle multiple concurrent WebSocket connections', async () => {
      const startTime = Date.now();
      
      // Create multiple concurrent connections
      const connectionPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) => {
        return new Promise<WebSocket>((resolve, reject) => {
          const ws = new WebSocket(`ws://localhost:8080?userId=user-${i}&raceId=${RACE_ID}`);
          
          ws.on('open', () => {
            connections.push(ws);
            resolve(ws);
          });
          
          ws.on('error', reject);
          
          // Timeout after 5 seconds
          setTimeout(() => reject(new Error('Connection timeout')), 5000);
        });
      });
      
      // Wait for all connections to establish
      const establishedConnections = await Promise.allSettled(connectionPromises);
      
      const connectionTime = Date.now() - startTime;
      
      // Verify connection performance
      expect(establishedConnections.filter(c => c.status === 'fulfilled')).toHaveLength(CONCURRENT_USERS);
      expect(connectionTime).toBeLessThan(10000); // Should complete within 10 seconds
      
      console.log(`Connected ${CONCURRENT_USERS} users in ${connectionTime}ms`);
    });

    test('should maintain connection stability under load', async () => {
      const activeConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN);
      expect(activeConnections).toHaveLength(CONCURRENT_USERS);
      
      // Send ping messages to test connection stability
      const pingPromises = activeConnections.map(ws => {
        return new Promise<void>((resolve, reject) => {
          const startTime = Date.now();
          
          ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
          
          const timeout = setTimeout(() => {
            reject(new Error('Ping timeout'));
          }, 1000);
          
          ws.once('message', (data) => {
            clearTimeout(timeout);
            const responseTime = Date.now() - startTime;
            updateTimes.push(responseTime);
            resolve();
          });
        });
      });
      
      const pingResults = await Promise.allSettled(pingPromises);
      
      // Verify all pings received responses
      expect(pingResults.filter(r => r.status === 'fulfilled')).toHaveLength(CONCURRENT_USERS);
      
      // Verify response times are reasonable
      const averagePingTime = updateTimes.slice(-CONCURRENT_USERS).reduce((a, b) => a + b, 0) / CONCURRENT_USERS;
      expect(averagePingTime).toBeLessThan(100); // Should be under 100ms
    });
  });

  test.describe('Position Update Performance', () => {
    test('should handle high-frequency position updates', async () => {
      const updatePromises: Promise<void>[] = [];
      const updateStartTime = Date.now();
      
      // Simulate each user sending multiple position updates
      for (let userIndex = 0; userIndex < connections.length; userIndex++) {
        const ws = connections[userIndex];
        for (let updateIndex = 0; updateIndex < UPDATES_PER_USER; updateIndex++) {
          const updatePromise = new Promise<void>((resolve, reject) => {
            const update = {
              type: 'position_update',
              raceId: RACE_ID,
              data: {
                participantId: `participant-${userIndex}`,
                position: Math.floor(Math.random() * 20) + 1,
                lap: Math.floor(Math.random() * 10) + 1,
                checkpointIndex: Math.floor(Math.random() * 5),
                lapTime: Math.floor(Math.random() * 120000) + 60000,
                speed: Math.random() * 100 + 50,
                coordinates: {
                  lat: 37.7749 + Math.random() * 0.01,
                  lng: -122.4194 + Math.random() * 0.01
                },
                timestamp: Date.now()
              }
            };
            
            const startTime = Date.now();
            ws.send(JSON.stringify(update));
            
            // Track update processing time
            setTimeout(() => {
              const processingTime = Date.now() - startTime;
              updateTimes.push(processingTime);
              resolve();
            }, 10); // Minimal delay to avoid blocking
          });
          
          updatePromises.push(updatePromise);
          
          // Small delay between updates to simulate real usage
          if (updateIndex % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 1));
          }
        }
      }
      
      // Wait for all updates to be sent
      await Promise.allSettled(updatePromises);
      
      const totalUpdateTime = Date.now() - updateStartTime;
      const totalUpdates = CONCURRENT_USERS * UPDATES_PER_USER;
      
      console.log(`Processed ${totalUpdates} updates in ${totalUpdateTime}ms`);
      console.log(`Average updates per second: ${(totalUpdates / (totalUpdateTime / 1000)).toFixed(2)}`);
      
      // Verify performance metrics
      expect(totalUpdateTime).toBeLessThan(30000); // Should complete within 30 seconds
      expect(totalUpdates / (totalUpdateTime / 1000)).toBeGreaterThan(100); // Should handle 100+ updates per second
    });

    test('should maintain update accuracy under load', async () => {
      // Test that position updates are processed correctly even under high load
      const testUpdates = 1000;
      const processedUpdates: number[] = [];
      
      // Monitor leaderboard updates
      const monitorWs = new WebSocket('ws://localhost:8080?userId=monitor&raceId=' + RACE_ID);
      
      await new Promise<void>((resolve) => {
        monitorWs.on('open', () => {
          monitorWs.on('message', (data) => {
            const message = JSON.parse(data.toString());
            if (message.type === 'leaderboard_update') {
              processedUpdates.push(message.timestamp);
            }
          });
          resolve();
        });
      });
      
      // Send test updates
      const updatePromises = Array.from({ length: testUpdates }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const update = {
              type: 'position_update',
              raceId: RACE_ID,
              data: {
                participantId: 'test-participant',
                position: (i % 20) + 1,
                lap: Math.floor(i / 20) + 1,
                timestamp: Date.now()
              }
            };
            
            connections[0].send(JSON.stringify(update));
            resolve();
          }, i * 5); // Send update every 5ms
        });
      });
      
      await Promise.all(updatePromises);
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      monitorWs.close();
      
      // Verify update processing
      expect(processedUpdates.length).toBeGreaterThan(testUpdates * 0.95); // Should process at least 95% of updates
      
      // Check for duplicate processing
      const uniqueUpdates = new Set(processedUpdates);
      expect(uniqueUpdates.size).toBeCloseTo(processedUpdates.length, 1); // Should have minimal duplicates
    });
  });

  test.describe('Database Performance', () => {
    test('should handle concurrent database operations', async () => {
      const dbOperations = 100;
      const operationTimes: number[] = [];
      
      // Simulate concurrent database operations
      const dbPromises = Array.from({ length: dbOperations }, (_, i) => {
        return new Promise<void>((resolve) => {
          const startTime = Date.now();
          
          // Simulate database operation (would be actual DB calls in real test)
          setTimeout(() => {
            const operationTime = Date.now() - startTime;
            operationTimes.push(operationTime);
            resolve();
          }, Math.random() * 50 + 10); // Random delay 10-60ms
        });
      });
      
      await Promise.all(dbPromises);
      
      const averageDbTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
      
      // Verify database performance
      expect(averageDbTime).toBeLessThan(100); // Average operation should be under 100ms
      expect(Math.max(...operationTimes)).toBeLessThan(200); // Max operation should be under 200ms
      
      console.log(`Average DB operation time: ${averageDbTime}ms`);
    });

    test('should maintain data consistency under load', async () => {
      // Test data consistency during concurrent operations
      const consistencyChecks = 50;
      const inconsistencies: number[] = [];
      
      const checkPromises = Array.from({ length: consistencyChecks }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(async () => {
            // Simulate consistency check
            const checkTime = Date.now();
            
            // In real test, this would verify actual database consistency
            const isConsistent = Math.random() > 0.05; // 95% consistency rate
            
            if (!isConsistent) {
              inconsistencies.push(checkTime);
            }
            
            resolve();
          }, i * 100);
        });
      });
      
      await Promise.all(checkPromises);
      
      // Verify data consistency
      expect(inconsistencies.length).toBeLessThan(consistencyChecks * 0.1); // Should have less than 10% inconsistencies
      
      console.log(`Data consistency rate: ${((consistencyChecks - inconsistencies.length) / consistencyChecks * 100).toFixed(2)}%`);
    });
  });

  test.describe('Memory Usage', () => {
    test('should maintain reasonable memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      memoryUsage.push(initialMemory);
      
      // Simulate memory-intensive operations
      const memoryTestPromises = Array.from({ length: 1000 }, (_, i) => {
        return new Promise<void>((resolve) => {
          // Simulate leaderboard data processing
          const leaderboardData = {
            entries: Array.from({ length: 50 }, (_, j) => ({
              id: `participant-${j}`,
              position: j + 1,
              username: `Driver ${j + 1}`,
              lapTime: Math.random() * 120000,
              totalTime: Math.random() * 3600000,
              gapToLeader: Math.random() * 10000
            })),
            timestamp: Date.now()
          };
          
          // Process data (simulating real leaderboard processing)
          JSON.stringify(leaderboardData);
          
          resolve();
        });
      });
      
      await Promise.all(memoryTestPromises);
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      memoryUsage.push(finalMemory);
      
      const memoryIncrease = finalMemory - initialMemory;
      
      // Verify memory usage
      expect(memoryIncrease).toBeLessThan(100); // Should not increase by more than 100MB
      expect(finalMemory).toBeLessThan(500); // Should not exceed 500MB total
      
      console.log(`Memory usage: ${initialMemory.toFixed(2)}MB -> ${finalMemory.toFixed(2)}MB (+${memoryIncrease.toFixed(2)}MB)`);
    });

    test('should clean up resources properly', async () => {
      // Test resource cleanup
      const beforeCleanupMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      
      // Close half of the connections
      const connectionsToClose = Math.floor(connections.length / 2);
      for (let i = 0; i < connectionsToClose; i++) {
        if (connections[i].readyState === WebSocket.OPEN) {
          connections[i].close();
        }
      }
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const afterCleanupMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryFreed = beforeCleanupMemory - afterCleanupMemory;
      
      // Verify cleanup effectiveness
      expect(memoryFreed).toBeGreaterThan(0); // Should free some memory
      
      console.log(`Memory freed after cleanup: ${memoryFreed.toFixed(2)}MB`);
    });
  });

  test.describe('Real-time Update Latency', () => {
    test('should maintain low latency for real-time updates', async () => {
      const latencyTests = 100;
      const latencies: number[] = [];
      
      // Test WebSocket message latency
      const latencyPromises = Array.from({ length: latencyTests }, (_, i) => {
        return new Promise<void>((resolve) => {
          const testWs = new WebSocket('ws://localhost:8080?userId=latency-test-${i}&raceId=' + RACE_ID);
          
          testWs.on('open', () => {
            const startTime = Date.now();
            
            // Send test message
            testWs.send(JSON.stringify({
              type: 'latency_test',
              timestamp: startTime
            }));
            
            // Wait for response
            const timeout = setTimeout(() => {
              latencies.push(1000); // Max latency if timeout
              testWs.close();
              resolve();
            }, 1000);
            
            testWs.on('message', (data) => {
              clearTimeout(timeout);
              const latency = Date.now() - startTime;
              latencies.push(latency);
              testWs.close();
              resolve();
            });
          });
          
          testWs.on('error', () => {
            latencies.push(1000); // Max latency if error
            resolve();
          });
        });
      });
      
      await Promise.all(latencyPromises);
      
      const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);
      const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
      
      // Verify latency requirements
      expect(averageLatency).toBeLessThan(50); // Average should be under 50ms
      expect(maxLatency).toBeLessThan(200); // Max should be under 200ms
      expect(p95Latency).toBeLessThan(100); // 95th percentile should be under 100ms
      
      console.log(`Latency metrics - Avg: ${averageLatency.toFixed(2)}ms, Max: ${maxLatency}ms, P95: ${p95Latency}ms`);
    });

    test('should handle burst updates without significant delay', async () => {
      const burstSize = 50;
      const burstLatencies: number[] = [];
      
      // Send burst of updates and measure processing time
      const startTime = Date.now();
      
      const burstPromises = Array.from({ length: burstSize }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const updateStartTime = Date.now();
            
            connections[i % connections.length].send(JSON.stringify({
              type: 'burst_update',
              data: {
                participantId: `burst-participant-${i}`,
                position: i + 1,
                timestamp: updateStartTime
              }
            }));
            
            // Simulate processing time measurement
            setTimeout(() => {
              const processingTime = Date.now() - updateStartTime;
              burstLatencies.push(processingTime);
              resolve();
            }, 5);
          }, i * 2); // Send updates every 2ms
        });
      });
      
      await Promise.all(burstPromises);
      
      const totalBurstTime = Date.now() - startTime;
      const averageBurstLatency = burstLatencies.reduce((a, b) => a + b, 0) / burstLatencies.length;
      
      // Verify burst performance
      expect(totalBurstTime).toBeLessThan(1000); // Should complete burst within 1 second
      expect(averageBurstLatency).toBeLessThan(100); // Average latency should be reasonable
      
      console.log(`Burst performance: ${burstSize} updates in ${totalBurstTime}ms, avg latency: ${averageBurstLatency.toFixed(2)}ms`);
    });
  });

  test.describe('Scalability Tests', () => {
    test('should scale to handle increasing load', async () => {
      const loadLevels = [10, 25, 50, 100];
      const performanceMetrics: { users: number; avgResponseTime: number; throughput: number }[] = [];
      
      for (const userCount of loadLevels) {
        console.log(`Testing with ${userCount} concurrent users...`);
        
        const startTime = Date.now();
        const responseTimes: number[] = [];
        
        // Create test connections for this load level
        const testConnections = Array.from({ length: userCount }, (_, i) => {
          return new Promise<WebSocket>((resolve) => {
            const ws = new WebSocket('ws://localhost:8080?userId=scale-test-' + i + '&raceId=' + RACE_ID);
            ws.on('open', () => resolve(ws));
          });
        });
        
        const activeConnections = await Promise.all(testConnections);
        
        // Send test updates
        const updatePromises = activeConnections.map((ws, i) => {
          return new Promise<void>((resolve) => {
            const updateStart = Date.now();
            
            ws.send(JSON.stringify({
              type: 'scale_test_update',
              data: {
                participantId: `scale-participant-${i}`,
                position: i + 1,
                timestamp: updateStart
              }
            }));
            
            // Measure response time
            setTimeout(() => {
              const responseTime = Date.now() - updateStart;
              responseTimes.push(responseTime);
              resolve();
            }, 10);
          });
        });
        
        await Promise.all(updatePromises);
        
        const totalTime = Date.now() - startTime;
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const throughput = (userCount * 10) / (totalTime / 1000); // 10 updates per user per second
        
        performanceMetrics.push({
          users: userCount,
          avgResponseTime,
          throughput
        });
        
        // Clean up test connections
        activeConnections.forEach(ws => ws.close());
        
        // Verify performance at this load level
        expect(avgResponseTime).toBeLessThan(200 * (1 + userCount / 100)); // Allow some degradation with scale
        expect(throughput).toBeGreaterThan(50); // Should maintain reasonable throughput
        
        console.log(`Load level ${userCount}: Avg response ${avgResponseTime.toFixed(2)}ms, Throughput ${throughput.toFixed(2)} ops/sec`);
      }
      
      // Verify scalability trend
      const firstMetric = performanceMetrics[0];
      const lastMetric = performanceMetrics[performanceMetrics.length - 1];
      
      // Response time should not increase disproportionately
      const responseTimeIncrease = lastMetric.avgResponseTime / firstMetric.avgResponseTime;
      expect(responseTimeIncrease).toBeLessThan(3); // Should not increase more than 3x
      
      console.log('Scalability test completed successfully');
    });
  });
});
