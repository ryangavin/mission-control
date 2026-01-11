import { existsSync, mkdirSync, cpSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getRemoteScriptsPath, getInstalledScriptPath, defaultConfig } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Get the path to the bundled remote script in our package
 */
function getBundledScriptPath(): string {
  // In development, it's relative to src
  // In production, it's relative to dist
  const devPath = join(__dirname, '..', 'remote-script', defaultConfig.remoteScriptName);
  const prodPath = join(__dirname, '..', '..', 'remote-script', defaultConfig.remoteScriptName);

  if (existsSync(devPath)) return devPath;
  if (existsSync(prodPath)) return prodPath;

  throw new Error('Could not find bundled remote script');
}

export interface InstallResult {
  success: boolean;
  message: string;
  path?: string;
}

/**
 * Install the remote script to Ableton's Remote Scripts folder
 */
export function install(): InstallResult {
  try {
    const remoteScriptsPath = getRemoteScriptsPath();
    const targetPath = getInstalledScriptPath();
    const sourcePath = getBundledScriptPath();

    // Check if source exists
    if (!existsSync(sourcePath)) {
      return {
        success: false,
        message: `Bundled remote script not found at: ${sourcePath}`,
      };
    }

    // Create Remote Scripts folder if it doesn't exist
    if (!existsSync(remoteScriptsPath)) {
      console.log(`Creating Remote Scripts folder: ${remoteScriptsPath}`);
      mkdirSync(remoteScriptsPath, { recursive: true });
    }

    // Remove existing installation if present
    if (existsSync(targetPath)) {
      console.log(`Removing existing installation: ${targetPath}`);
      rmSync(targetPath, { recursive: true, force: true });
    }

    // Copy the remote script
    console.log(`Installing to: ${targetPath}`);
    cpSync(sourcePath, targetPath, { recursive: true });

    return {
      success: true,
      message: `Successfully installed ${defaultConfig.remoteScriptName} remote script`,
      path: targetPath,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during installation',
    };
  }
}

/**
 * Check if the remote script is installed
 */
export function isInstalled(): boolean {
  return existsSync(getInstalledScriptPath());
}

/**
 * Uninstall the remote script
 */
export function uninstall(): InstallResult {
  try {
    const targetPath = getInstalledScriptPath();

    if (!existsSync(targetPath)) {
      return {
        success: true,
        message: 'Remote script is not installed',
      };
    }

    rmSync(targetPath, { recursive: true, force: true });

    return {
      success: true,
      message: `Successfully uninstalled ${defaultConfig.remoteScriptName} remote script`,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error during uninstallation',
    };
  }
}
