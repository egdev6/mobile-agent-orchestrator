#!/usr/bin/env node

import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { assertReleaseTransition, parseSemVer } from "./validate-package.mjs";

export function detectReleaseTransition(baseVersion, currentVersion) {
  const base = parseSemVer(baseVersion);
  const current = parseSemVer(currentVersion);
  if (!base) throw new Error(`Base version is not valid SemVer: ${JSON.stringify(baseVersion)}.`);
  if (!current) throw new Error(`Release version is not valid SemVer: ${JSON.stringify(currentVersion)}.`);

  if (baseVersion === currentVersion) return { shouldTag: false };

  assertReleaseTransition(baseVersion, currentVersion);
  return { shouldTag: true, version: currentVersion };
}

function main() {
  try {
    const result = detectReleaseTransition(process.argv[2], process.argv[3]);
    if (!result.shouldTag) {
      console.log("should_tag=false");
      return 0;
    }
    console.log("should_tag=true");
    console.log(`version=${result.version}`);
    return 0;
  } catch (error) {
    console.error(`Invalid release transition: ${error.message}`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
