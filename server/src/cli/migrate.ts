#!/usr/bin/env node

/**
 * Database Migration CLI
 * 
 * Usage:
 *   npm run migrate up         - Run all pending migrations
 *   npm run migrate status     - Show migration status
 *   npm run migrate rollback    - Rollback last migration
 *   npm run migrate create <name> <description> - Create new migration
 */

import { migrationRunner } from '../database/migration-runner';
import { logger } from '../utils/logger';

async function main() {
  const command = process.argv[2];
  const name = process.argv[3];
  const description = process.argv[4];

  try {
    switch (command) {
      case 'up':
        await migrationRunner.runMigrations();
        break;
        
      case 'status':
        const status = await migrationRunner.getStatus();
        console.log('\n=== Migration Status ===');
        console.log(`Executed: ${status.executed}`);
        console.log(`Pending: ${status.pending}`);
        console.log(`Latest: ${status.latest || 'None'}`);
        console.log('========================\n');
        break;
        
      case 'rollback':
        await migrationRunner.rollbackLastMigration();
        break;
        
      case 'create':
        if (!name || !description) {
          console.error('Usage: npm run migrate create <name> <description>');
          process.exit(1);
        }
        const filename = await migrationRunner.createMigration(name, description);
        console.log(`Created migration: ${filename}`);
        break;
        
      default:
        console.log(`
Usage: npm run migrate <command>

Commands:
  up                          Run all pending migrations
  status                      Show migration status
  rollback                    Rollback last migration
  create <name> <description> Create new migration file

Examples:
  npm run migrate up
  npm run migrate status
  npm run migrate rollback
  npm run migrate create add_user_profile "Add user profile settings"
        `);
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration command failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
