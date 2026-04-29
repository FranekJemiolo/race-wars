# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: performance/leaderboard-performance.test.ts >> Leaderboard Performance Tests >> Real-time Update Latency >> should handle burst updates without significant delay
- Location: tests/performance/leaderboard-performance.test.ts:428:9

# Error details

```
TypeError: Cannot read properties of undefined (reading 'send')
```

# Test source

```ts
  340 |     });
  341 | 
  342 |     test('should clean up resources properly', async () => {
  343 |       // Test resource cleanup
  344 |       const beforeCleanupMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  345 |       
  346 |       // Close half of the connections
  347 |       const connectionsToClose = Math.floor(connections.length / 2);
  348 |       for (let i = 0; i < connectionsToClose; i++) {
  349 |         if (connections[i].readyState === WebSocket.OPEN) {
  350 |           connections[i].close();
  351 |         }
  352 |       }
  353 |       
  354 |       // Wait for cleanup
  355 |       await new Promise(resolve => setTimeout(resolve, 1000));
  356 |       
  357 |       // Force garbage collection
  358 |       if (global.gc) {
  359 |         global.gc();
  360 |       }
  361 |       
  362 |       const afterCleanupMemory = process.memoryUsage().heapUsed / 1024 / 1024;
  363 |       const memoryFreed = beforeCleanupMemory - afterCleanupMemory;
  364 |       
  365 |       // Verify cleanup effectiveness
  366 |       expect(memoryFreed).toBeGreaterThan(0); // Should free some memory
  367 |       
  368 |       console.log(`Memory freed after cleanup: ${memoryFreed.toFixed(2)}MB`);
  369 |     });
  370 |   });
  371 | 
  372 |   test.describe('Real-time Update Latency', () => {
  373 |     test('should maintain low latency for real-time updates', async () => {
  374 |       const latencyTests = 100;
  375 |       const latencies: number[] = [];
  376 |       
  377 |       // Test WebSocket message latency
  378 |       const latencyPromises = Array.from({ length: latencyTests }, (_, i) => {
  379 |         return new Promise<void>((resolve) => {
  380 |           const testWs = new WebSocket('ws://localhost:8080?userId=latency-test-${i}&raceId=' + RACE_ID);
  381 |           
  382 |           testWs.on('open', () => {
  383 |             const startTime = Date.now();
  384 |             
  385 |             // Send test message
  386 |             testWs.send(JSON.stringify({
  387 |               type: 'latency_test',
  388 |               timestamp: startTime
  389 |             }));
  390 |             
  391 |             // Wait for response
  392 |             const timeout = setTimeout(() => {
  393 |               latencies.push(1000); // Max latency if timeout
  394 |               testWs.close();
  395 |               resolve();
  396 |             }, 1000);
  397 |             
  398 |             testWs.on('message', (data) => {
  399 |               clearTimeout(timeout);
  400 |               const latency = Date.now() - startTime;
  401 |               latencies.push(latency);
  402 |               testWs.close();
  403 |               resolve();
  404 |             });
  405 |           });
  406 |           
  407 |           testWs.on('error', () => {
  408 |             latencies.push(1000); // Max latency if error
  409 |             resolve();
  410 |           });
  411 |         });
  412 |       });
  413 |       
  414 |       await Promise.all(latencyPromises);
  415 |       
  416 |       const averageLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  417 |       const maxLatency = Math.max(...latencies);
  418 |       const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];
  419 |       
  420 |       // Verify latency requirements
  421 |       expect(averageLatency).toBeLessThan(50); // Average should be under 50ms
  422 |       expect(maxLatency).toBeLessThan(200); // Max should be under 200ms
  423 |       expect(p95Latency).toBeLessThan(100); // 95th percentile should be under 100ms
  424 |       
  425 |       console.log(`Latency metrics - Avg: ${averageLatency.toFixed(2)}ms, Max: ${maxLatency}ms, P95: ${p95Latency}ms`);
  426 |     });
  427 | 
  428 |     test('should handle burst updates without significant delay', async () => {
  429 |       const burstSize = 50;
  430 |       const burstLatencies: number[] = [];
  431 |       
  432 |       // Send burst of updates and measure processing time
  433 |       const startTime = Date.now();
  434 |       
  435 |       const burstPromises = Array.from({ length: burstSize }, (_, i) => {
  436 |         return new Promise<void>((resolve) => {
  437 |           setTimeout(() => {
  438 |             const updateStartTime = Date.now();
  439 |             
> 440 |             connections[i % connections.length].send(JSON.stringify({
      |                                                 ^ TypeError: Cannot read properties of undefined (reading 'send')
  441 |               type: 'burst_update',
  442 |               data: {
  443 |                 participantId: `burst-participant-${i}`,
  444 |                 position: i + 1,
  445 |                 timestamp: updateStartTime
  446 |               }
  447 |             }));
  448 |             
  449 |             // Simulate processing time measurement
  450 |             setTimeout(() => {
  451 |               const processingTime = Date.now() - updateStartTime;
  452 |               burstLatencies.push(processingTime);
  453 |               resolve();
  454 |             }, 5);
  455 |           }, i * 2); // Send updates every 2ms
  456 |         });
  457 |       });
  458 |       
  459 |       await Promise.all(burstPromises);
  460 |       
  461 |       const totalBurstTime = Date.now() - startTime;
  462 |       const averageBurstLatency = burstLatencies.reduce((a, b) => a + b, 0) / burstLatencies.length;
  463 |       
  464 |       // Verify burst performance
  465 |       expect(totalBurstTime).toBeLessThan(1000); // Should complete burst within 1 second
  466 |       expect(averageBurstLatency).toBeLessThan(100); // Average latency should be reasonable
  467 |       
  468 |       console.log(`Burst performance: ${burstSize} updates in ${totalBurstTime}ms, avg latency: ${averageBurstLatency.toFixed(2)}ms`);
  469 |     });
  470 |   });
  471 | 
  472 |   test.describe('Scalability Tests', () => {
  473 |     test('should scale to handle increasing load', async () => {
  474 |       const loadLevels = [10, 25, 50, 100];
  475 |       const performanceMetrics: { users: number; avgResponseTime: number; throughput: number }[] = [];
  476 |       
  477 |       for (const userCount of loadLevels) {
  478 |         console.log(`Testing with ${userCount} concurrent users...`);
  479 |         
  480 |         const startTime = Date.now();
  481 |         const responseTimes: number[] = [];
  482 |         
  483 |         // Create test connections for this load level
  484 |         const testConnections = Array.from({ length: userCount }, (_, i) => {
  485 |           return new Promise<WebSocket>((resolve) => {
  486 |             const ws = new WebSocket('ws://localhost:8080?userId=scale-test-' + i + '&raceId=' + RACE_ID);
  487 |             ws.on('open', () => resolve(ws));
  488 |           });
  489 |         });
  490 |         
  491 |         const activeConnections = await Promise.all(testConnections);
  492 |         
  493 |         // Send test updates
  494 |         const updatePromises = activeConnections.map((ws, i) => {
  495 |           return new Promise<void>((resolve) => {
  496 |             const updateStart = Date.now();
  497 |             
  498 |             ws.send(JSON.stringify({
  499 |               type: 'scale_test_update',
  500 |               data: {
  501 |                 participantId: `scale-participant-${i}`,
  502 |                 position: i + 1,
  503 |                 timestamp: updateStart
  504 |               }
  505 |             }));
  506 |             
  507 |             // Measure response time
  508 |             setTimeout(() => {
  509 |               const responseTime = Date.now() - updateStart;
  510 |               responseTimes.push(responseTime);
  511 |               resolve();
  512 |             }, 10);
  513 |           });
  514 |         });
  515 |         
  516 |         await Promise.all(updatePromises);
  517 |         
  518 |         const totalTime = Date.now() - startTime;
  519 |         const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  520 |         const throughput = (userCount * 10) / (totalTime / 1000); // 10 updates per user per second
  521 |         
  522 |         performanceMetrics.push({
  523 |           users: userCount,
  524 |           avgResponseTime,
  525 |           throughput
  526 |         });
  527 |         
  528 |         // Clean up test connections
  529 |         activeConnections.forEach(ws => ws.close());
  530 |         
  531 |         // Verify performance at this load level
  532 |         expect(avgResponseTime).toBeLessThan(200 * (1 + userCount / 100)); // Allow some degradation with scale
  533 |         expect(throughput).toBeGreaterThan(50); // Should maintain reasonable throughput
  534 |         
  535 |         console.log(`Load level ${userCount}: Avg response ${avgResponseTime.toFixed(2)}ms, Throughput ${throughput.toFixed(2)} ops/sec`);
  536 |       }
  537 |       
  538 |       // Verify scalability trend
  539 |       const firstMetric = performanceMetrics[0];
  540 |       const lastMetric = performanceMetrics[performanceMetrics.length - 1];
```