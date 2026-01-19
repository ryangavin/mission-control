#!/usr/bin/env bun
/**
 * Release script - tags current version and bumps to next version
 * Usage: bun scripts/release.ts
 */

import { $ } from "bun";

// Files that contain version numbers
const VERSION_FILES = [
  "package.json",
  "desktop/src-tauri/tauri.conf.json",
  "desktop/src-tauri/Cargo.toml",
];

async function getCurrentVersion(): Promise<string> {
  const pkg = await Bun.file("package.json").json();
  return pkg.version;
}

function bumpVersion(version: string): string {
  const parts = version.split(".").map(Number);
  parts[2]++; // bump patch version
  return parts.join(".");
}

async function updateVersion(file: string, oldVersion: string, newVersion: string) {
  const content = await Bun.file(file).text();

  let updated: string;
  if (file.endsWith(".toml")) {
    updated = content.replace(`version = "${oldVersion}"`, `version = "${newVersion}"`);
  } else {
    updated = content.replace(`"version": "${oldVersion}"`, `"version": "${newVersion}"`);
  }

  await Bun.write(file, updated);
}

async function main() {
  // Check for uncommitted changes
  const status = await $`git status --porcelain`.text();
  if (status.trim()) {
    console.error("Error: Uncommitted changes exist. Please commit or stash them first.");
    process.exit(1);
  }

  const currentVersion = await getCurrentVersion();
  const nextVersion = bumpVersion(currentVersion);
  const tag = `v${currentVersion}`;

  console.log(`Current version: ${currentVersion}`);
  console.log(`Creating tag: ${tag}`);
  console.log(`Next version: ${nextVersion}`);
  console.log();

  // Create tag
  await $`git tag ${tag}`;
  console.log(`Tagged ${tag}`);

  // Update version in all files
  for (const file of VERSION_FILES) {
    await updateVersion(file, currentVersion, nextVersion);
    console.log(`Updated ${file}`);
  }

  // Commit version bump
  await $`git add -A`;
  await $`git commit -m "Bump version to ${nextVersion}" -m "Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"`;
  console.log(`Committed version bump to ${nextVersion}`);

  console.log();
  console.log("Done! To push the release:");
  console.log(`  git push && git push origin ${tag}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
