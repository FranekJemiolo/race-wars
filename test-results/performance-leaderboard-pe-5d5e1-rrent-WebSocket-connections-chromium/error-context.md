# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance/leaderboard-performance.test.ts >> Leaderboard Performance Tests >> WebSocket Connection Performance >> should handle multiple concurrent WebSocket connections
- Location: tests/performance/leaderboard-performance.test.ts:47:9

# Error details

```
Error: expect(received).toHaveLength(expected)

Expected length: 50
Received length: 0
Received array:  []
```

# Test source

```ts
  1   | /**
  2   |  * Performance Tests for Leaderboard with Multiple Concurrent Users
  3   |  * 
  4   |  * Tests the leaderboard system under load to ensure it can handle:
  5   |  * - Multiple concurrent WebSocket connections
  6   |  * - High-frequency position updates
  7   |  * - Database performance under load
  8   |  * - Memory usage and scalability
  9   |  * - Real-time update latency
  10  |  */
  11  | 
  12  | import { test, expect } from '@playwright/test';
  13  | import { WebSocket } from 'ws';
  14  | 
  15  | test.describe('Leaderboard Performance Tests', () => {
  16  |   const CONCURRENT_USERS = 50;
  17  |   const UPDATES_PER_USER = 100;
  18  |   const RACE_ID = 'performance-test-race';
  19  |   
  20  |   let connections: WebSocket[] = [];
  21  |   let updateTimes: number[] = [];
  22  |   let memoryUsage: number[] = [];
  23  | 
  24  |   test.beforeAll(async () => {
  25  |     // Initialize test race
  26  |     console.log('Initializing performance test race...');
  27  |   });
  28  | 
  29  |   test.afterAll(async () => {
  30  |     // Clean up connections
  31  |     connections.forEach(ws => {
  32  |       if (ws.readyState === WebSocket.OPEN) {
  33  |         ws.close();
  34  |       }
  35  |     });
  36  |     connections = [];
  37  |     
  38  |     // Log performance metrics
  39  |     console.log('Performance Test Results:');
  40  |     console.log(`Average update time: ${updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length}ms`);
  41  |     console.log(`Max update time: ${Math.max(...updateTimes)}ms`);
  42  |     console.log(`Min update time: ${Math.min(...updateTimes)}ms`);
  43  |     console.log(`Average memory usage: ${memoryUsage.reduce((a, b) => a + b, 0) / memoryUsage.length}MB`);
  44  |   });
  45  | 
  46  |   test.describe('WebSocket Connection Performance', () => {
  47  |     test('should handle multiple concurrent WebSocket connections', async () => {
  48  |       const startTime = Date.now();
  49  |       
  50  |       // Create multiple concurrent connections
  51  |       const connectionPromises = Array.from({ length: CONCURRENT_USERS }, (_, i) => {
  52  |         return new Promise<WebSocket>((resolve, reject) => {
  53  |           const ws = new WebSocket(`ws://localhost:8080?userId=user-${i}&raceId=${RACE_ID}`);
  54  |           
  55  |           ws.on('open', () => {
  56  |             connections.push(ws);
  57  |             resolve(ws);
  58  |           });
  59  |           
  60  |           ws.on('error', reject);
  61  |           
  62  |           // Timeout after 5 seconds
  63  |           setTimeout(() => reject(new Error('Connection timeout')), 5000);
  64  |         });
  65  |       });
  66  |       
  67  |       // Wait for all connections to establish
  68  |       const establishedConnections = await Promise.allSettled(connectionPromises);
  69  |       
  70  |       const connectionTime = Date.now() - startTime;
  71  |       
  72  |       // Verify connection performance
> 73  |       expect(establishedConnections.filter(c => c.status === 'fulfilled')).toHaveLength(CONCURRENT_USERS);
      |                                                                            ^ Error: expect(received).toHaveLength(expected)
  74  |       expect(connectionTime).toBeLessThan(10000); // Should complete within 10 seconds
  75  |       
  76  |       console.log(`Connected ${CONCURRENT_USERS} users in ${connectionTime}ms`);
  77  |     });
  78  | 
  79  |     test('should maintain connection stability under load', async () => {
  80  |       const activeConnections = connections.filter(ws => ws.readyState === WebSocket.OPEN);
  81  |       expect(activeConnections).toHaveLength(CONCURRENT_USERS);
  82  |       
  83  |       // Send ping messages to test connection stability
  84  |       const pingPromises = activeConnections.map(ws => {
  85  |         return new Promise<void>((resolve, reject) => {
  86  |           const startTime = Date.now();
  87  |           
  88  |           ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
  89  |           
  90  |           const timeout = setTimeout(() => {
  91  |             reject(new Error('Ping timeout'));
  92  |           }, 1000);
  93  |           
  94  |           ws.once('message', (data) => {
  95  |             clearTimeout(timeout);
  96  |             const responseTime = Date.now() - startTime;
  97  |             updateTimes.push(responseTime);
  98  |             resolve();
  99  |           });
  100 |         });
  101 |       });
  102 |       
  103 |       const pingResults = await Promise.allSettled(pingPromises);
  104 |       
  105 |       // Verify all pings received responses
  106 |       expect(pingResults.filter(r => r.status === 'fulfilled')).toHaveLength(CONCURRENT_USERS);
  107 |       
  108 |       // Verify response times are reasonable
  109 |       const averagePingTime = updateTimes.slice(-CONCURRENT_USERS).reduce((a, b) => a + b, 0) / CONCURRENT_USERS;
  110 |       expect(averagePingTime).toBeLessThan(100); // Should be under 100ms
  111 |     });
  112 |   });
  113 | 
  114 |   test.describe('Position Update Performance', () => {
  115 |     test('should handle high-frequency position updates', async () => {
  116 |       const updatePromises: Promise<void>[] = [];
  117 |       const updateStartTime = Date.now();
  118 |       
  119 |       // Simulate each user sending multiple position updates
  120 |       for (let userIndex = 0; userIndex < connections.length; userIndex++) {
  121 |         const ws = connections[userIndex];
  122 |         for (let updateIndex = 0; updateIndex < UPDATES_PER_USER; updateIndex++) {
  123 |           const updatePromise = new Promise<void>((resolve, reject) => {
  124 |             const update = {
  125 |               type: 'position_update',
  126 |               raceId: RACE_ID,
  127 |               data: {
  128 |                 participantId: `participant-${userIndex}`,
  129 |                 position: Math.floor(Math.random() * 20) + 1,
  130 |                 lap: Math.floor(Math.random() * 10) + 1,
  131 |                 checkpointIndex: Math.floor(Math.random() * 5),
  132 |                 lapTime: Math.floor(Math.random() * 120000) + 60000,
  133 |                 speed: Math.random() * 100 + 50,
  134 |                 coordinates: {
  135 |                   lat: 37.7749 + Math.random() * 0.01,
  136 |                   lng: -122.4194 + Math.random() * 0.01
  137 |                 },
  138 |                 timestamp: Date.now()
  139 |               }
  140 |             };
  141 |             
  142 |             const startTime = Date.now();
  143 |             ws.send(JSON.stringify(update));
  144 |             
  145 |             // Track update processing time
  146 |             setTimeout(() => {
  147 |               const processingTime = Date.now() - startTime;
  148 |               updateTimes.push(processingTime);
  149 |               resolve();
  150 |             }, 10); // Minimal delay to avoid blocking
  151 |           });
  152 |           
  153 |           updatePromises.push(updatePromise);
  154 |           
  155 |           // Small delay between updates to simulate real usage
  156 |           if (updateIndex % 10 === 0) {
  157 |             await new Promise(resolve => setTimeout(resolve, 1));
  158 |           }
  159 |         }
  160 |       }
  161 |       
  162 |       // Wait for all updates to be sent
  163 |       await Promise.allSettled(updatePromises);
  164 |       
  165 |       const totalUpdateTime = Date.now() - updateStartTime;
  166 |       const totalUpdates = CONCURRENT_USERS * UPDATES_PER_USER;
  167 |       
  168 |       console.log(`Processed ${totalUpdates} updates in ${totalUpdateTime}ms`);
  169 |       console.log(`Average updates per second: ${(totalUpdates / (totalUpdateTime / 1000)).toFixed(2)}`);
  170 |       
  171 |       // Verify performance metrics
  172 |       expect(totalUpdateTime).toBeLessThan(30000); // Should complete within 30 seconds
  173 |       expect(totalUpdates / (totalUpdateTime / 1000)).toBeGreaterThan(100); // Should handle 100+ updates per second
```