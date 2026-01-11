#!/usr/bin/env node

import { Command } from 'commander';
import { install, uninstall, isInstalled } from './installer.js';
import { Bridge } from './bridge.js';
import { defaultConfig, getInstalledScriptPath } from './config.js';

const program = new Command();

program
  .name('mission-control')
  .description('Mission Control - Touch controller bridge for Ableton Live')
  .version('0.1.0');

program
  .command('install')
  .description('Install the remote script to Ableton Live')
  .action(() => {
    console.log('\nMission Control - Remote Script Installer\n');

    const result = install();

    if (result.success) {
      console.log(`\n✓ ${result.message}`);
      console.log(`  Installed to: ${result.path}`);
      console.log('\nNext steps:');
      console.log('  1. Restart Ableton Live (if running)');
      console.log('  2. Go to Preferences → Link/Tempo/MIDI → Control Surface');
      console.log('  3. Select "MissionControl" from the dropdown');
      console.log('  4. Run "mission-control start" to start the bridge server');
    } else {
      console.error(`\n✗ Installation failed: ${result.message}`);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Remove the remote script from Ableton Live')
  .action(() => {
    console.log('\nMission Control - Remote Script Uninstaller\n');

    const result = uninstall();

    if (result.success) {
      console.log(`✓ ${result.message}`);
    } else {
      console.error(`✗ Uninstallation failed: ${result.message}`);
      process.exit(1);
    }
  });

program
  .command('status')
  .description('Check installation and connection status')
  .action(() => {
    console.log('\nMission Control - Status\n');

    const installed = isInstalled();
    const path = getInstalledScriptPath();

    console.log(`Remote Script:`);
    console.log(`  Status: ${installed ? '✓ Installed' : '✗ Not installed'}`);
    console.log(`  Path: ${path}`);
    console.log();
    console.log(`Bridge Configuration:`);
    console.log(`  WebSocket Port: ${defaultConfig.wsPort}`);
    console.log(`  OSC Send Port: ${defaultConfig.oscSendPort}`);
    console.log(`  OSC Receive Port: ${defaultConfig.oscReceivePort}`);
  });

program
  .command('start')
  .description('Start the bridge server')
  .option('-p, --port <port>', 'WebSocket port', String(defaultConfig.wsPort))
  .action(async (options) => {
    console.log('\nMission Control - Bridge Server\n');

    // Check if remote script is installed
    if (!isInstalled()) {
      console.log('⚠ Remote script not installed. Run "mission-control install" first.');
      console.log('  (Continuing anyway for testing...)\n');
    }

    const config = {
      ...defaultConfig,
      wsPort: parseInt(options.port, 10),
    };

    const bridge = new Bridge({
      config,
      onLog: (msg) => console.log(`[${new Date().toISOString().slice(11, 19)}] ${msg}`),
    });

    // Handle shutdown gracefully
    const shutdown = async () => {
      console.log('\nShutting down...');
      await bridge.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    try {
      await bridge.start();

      console.log('\nReady! Press Ctrl+C to stop.\n');
      console.log('Test commands:');
      console.log('  - Connect a WebSocket client to ws://localhost:' + config.wsPort);
      console.log('  - Make sure Ableton is running with MissionControl selected');
      console.log('');
    } catch (error) {
      console.error('Failed to start bridge:', error);
      process.exit(1);
    }
  });

// Interactive test mode
program
  .command('test')
  .description('Test OSC communication with Ableton')
  .action(async () => {
    console.log('\nMission Control - OSC Test Mode\n');

    const bridge = new Bridge({
      config: defaultConfig,
      onLog: console.log,
    });

    try {
      await bridge.start();

      console.log('\nSending test commands to Ableton...\n');

      // Test: Get tempo
      console.log('→ Getting tempo...');
      bridge.sendRawOSC('/live/song/get/tempo');

      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Test: Get number of tracks
      console.log('→ Getting track count...');
      bridge.sendRawOSC('/live/song/get/num_tracks');

      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Keep running to receive responses
      console.log('\nListening for responses... Press Ctrl+C to stop.\n');
    } catch (error) {
      console.error('Test failed:', error);
      process.exit(1);
    }
  });

program.parse();
