import { homedir, platform } from 'os';
import { join } from 'path';

export interface Config {
  // OSC ports for Ableton communication
  oscSendPort: number;     // Port to send OSC messages to Ableton (default: 11000)
  oscReceivePort: number;  // Port to receive OSC messages from Ableton (default: 11001)

  // Remote script name
  remoteScriptName: string;
}

export const defaultConfig: Config = {
  oscSendPort: 11000,
  oscReceivePort: 11001,
  remoteScriptName: 'AbletonOSC',
};

/**
 * Get the path to Ableton's Remote Scripts folder based on OS
 */
export function getRemoteScriptsPath(): string {
  const os = platform();

  switch (os) {
    case 'darwin':
      // macOS
      return join(homedir(), 'Music', 'Ableton', 'User Library', 'Remote Scripts');
    case 'win32':
      // Windows
      return join(homedir(), 'Documents', 'Ableton', 'User Library', 'Remote Scripts');
    default:
      throw new Error(`Unsupported operating system: ${os}`);
  }
}

/**
 * Get the full path where our remote script should be installed
 */
export function getInstalledScriptPath(config: Config = defaultConfig): string {
  return join(getRemoteScriptsPath(), config.remoteScriptName);
}
