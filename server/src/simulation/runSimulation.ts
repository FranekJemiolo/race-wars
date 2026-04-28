#!/usr/bin/env node

import { SimulationManager, SimulationScenario } from './SimulationManager';

const SERVER_URL = process.env.SERVER_URL || 'ws://localhost:8080';
const SESSION_ID = process.env.SESSION_ID || 'test-session';
const SCENARIO = process.env.SCENARIO || 'mixed';

async function main() {
  console.log('Starting Race Wars Simulation...');
  console.log(`Server: ${SERVER_URL}`);
  console.log(`Session: ${SESSION_ID}`);
  console.log(`Scenario: ${SCENARIO}`);
  console.log('');

  const manager = new SimulationManager(SERVER_URL, SESSION_ID);

  const route = SimulationManager.createLagunaSecaRoute();

  let scenario: SimulationScenario;

  switch (SCENARIO) {
    case 'honest':
      scenario = {
        name: 'Honest Racers',
        description: 'All clients behave honestly',
        clients: manager.generateHonestRacers(10, route),
        duration: 60000,
      };
      break;

    case 'speed_cheat':
      scenario = {
        name: 'Speed Cheaters',
        description: 'Some clients use speed hacks',
        clients: [
          ...manager.generateHonestRacers(5, route),
          ...manager.generateSpeedCheaters(5, route, 2),
        ],
        duration: 60000,
      };
      break;

    case 'teleport_cheat':
      scenario = {
        name: 'Teleport Cheaters',
        description: 'Some clients teleport',
        clients: [
          ...manager.generateHonestRacers(5, route),
          ...manager.generateTeleportCheaters(5, route, 0.15),
        ],
        duration: 60000,
      };
      break;

    case 'erratic':
      scenario = {
        name: 'Erratic Drivers',
        description: 'Some drivers behave erratically',
        clients: [
          ...manager.generateHonestRacers(5, route),
          ...manager.generateErraticDrivers(5, route),
        ],
        duration: 60000,
      };
      break;

    case 'stall':
      scenario = {
        name: 'Stalling Drivers',
        description: 'Some drivers stall on track',
        clients: [
          ...manager.generateHonestRacers(5, route),
          ...manager.generateStallingDrivers(5, route, 3000),
        ],
        duration: 60000,
      };
      break;

    case 'mixed':
    default:
      scenario = {
        name: 'Mixed Scenario',
        description: 'Mix of honest and cheating clients',
        clients: manager.generateMixedScenario(5, 3, 2, route),
        duration: 60000,
      };
      break;
  }

  try {
    await manager.runScenario(scenario);

    // Monitor status
    const statusInterval = setInterval(() => {
      const status = manager.getClientStatus();
      console.log('Client Status:');
      status.forEach((s, id) => {
        console.log(`  ${id}: ${s.connected ? 'Connected' : 'Disconnected'} (${s.behavior})`);
      });
      console.log(`Total: ${manager.getConnectedClientCount()}/${manager.getClientCount()} connected`);
      console.log('');
    }, 5000);

    // Cleanup after duration
    setTimeout(() => {
      clearInterval(statusInterval);
      manager.removeAllClients();
      console.log('Simulation complete');
      process.exit(0);
    }, scenario.duration || 60000);

  } catch (error) {
    console.error('Simulation failed:', error);
    manager.removeAllClients();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down simulation...');
  process.exit(0);
});

main();
