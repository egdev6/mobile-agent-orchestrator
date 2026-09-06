#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const requiredSections = [
  "Activation Contract",
  "Hard Rules",
  "Decision Gates",
  "Execution Steps",
  "Output Contract",
  "References",
];

export function parseSemVer(version) {
  if (typeof version !== "string") return null;
  const match = version.match(semverPattern);
  if (!match) return null;
  return {
    major: match[1],
    minor: match[2],
    patch: match[3],
    prerelease: match[4]?.split(".") ?? [],
    build: match[5]?.split(".") ?? [],
  };
}

function compareNumericIdentifiers(left, right) {
  if (left.length !== right.length) return left.length < right.length ? -1 : 1;
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export function compareSemVer(left, right) {
  const leftVersion = typeof left === "string" ? parseSemVer(left) : left;
  const rightVersion = typeof right === "string" ? parseSemVer(right) : right;
  if (!leftVersion || !rightVersion) {
    throw new Error("SemVer comparison requires two valid SemVer versions.");
  }

  for (const key of ["major", "minor", "patch"]) {
    const comparison = compareNumericIdentifiers(leftVersion[key], rightVersion[key]);
    if (comparison !== 0) return comparison;
  }
  if (leftVersion.prerelease.length === 0 || rightVersion.prerelease.length === 0) {
    if (leftVersion.prerelease.length === rightVersion.prerelease.length) return 0;
    return leftVersion.prerelease.length === 0 ? 1 : -1;
  }

  const length = Math.max(leftVersion.prerelease.length, rightVersion.prerelease.length);
  for (let index = 0; index < length; index += 1) {
    const leftIdentifier = leftVersion.prerelease[index];
    const rightIdentifier = rightVersion.prerelease[index];
    if (leftIdentifier === undefined) return -1;
    if (rightIdentifier === undefined) return 1;
    if (leftIdentifier === rightIdentifier) continue;

    const leftNumeric = /^\d+$/.test(leftIdentifier);
    const rightNumeric = /^\d+$/.test(rightIdentifier);
    if (leftNumeric && rightNumeric) {
      return compareNumericIdentifiers(leftIdentifier, rightIdentifier);
    }
    if (leftNumeric !== rightNumeric) return leftNumeric ? -1 : 1;
    return leftIdentifier < rightIdentifier ? -1 : 1;
  }
  return 0;
}

export function assertReleaseTransition(baseVersion, releaseVersion) {
  const base = parseSemVer(baseVersion);
  const release = parseSemVer(releaseVersion);
  if (!base) throw new Error(`Base version is not valid SemVer: ${JSON.stringify(baseVersion)}.`);
  if (!release) throw new Error(`Release version is not valid SemVer: ${JSON.stringify(releaseVersion)}.`);
  if (release.prerelease.length > 0) {
    throw new Error(`Release version must be stable, not prerelease: ${releaseVersion}.`);
  }
  if (release.build.length > 0) {
    throw new Error(`Stable release version must not contain build metadata: ${releaseVersion}.`);
  }
  if (compareSemVer(base, release) >= 0) {
    throw new Error(`Release version must strictly increase SemVer precedence: ${baseVersion} -> ${releaseVersion}.`);
  }
}

export function parseSkillFrontmatter(skill) {
  const lines = skill.replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") {
    throw new Error("SKILL.md must start with a frontmatter delimiter.");
  }
  const closingIndex = lines.indexOf("---", 1);
  if (closingIndex === -1) {
    throw new Error("SKILL.md frontmatter must have a closing delimiter.");
  }

  const expectedTopLevel = ["name", "description", "license", "metadata"];
  const expectedMetadata = ["author", "version"];
  const frontmatter = {};
  let topIndex = 0;
  let metadataIndex = 0;
  let inMetadata = false;

  for (let index = 1; index < closingIndex; index += 1) {
    const line = lines[index];
    const number = index + 1;
    if (!line) throw new Error(`SKILL.md frontmatter line ${number} must not be blank.`);
    if (line.includes("\t")) throw new Error(`SKILL.md frontmatter line ${number} must not contain tabs.`);

    const topLevel = line.match(/^([a-z][a-z-]*):(?: (.*))?$/);
    const nested = line.match(/^ {2}([a-z][a-z-]*): (.+)$/);
    if (topLevel) {
      const [, key, rawValue] = topLevel;
      if (key !== expectedTopLevel[topIndex]) {
        throw new Error(`SKILL.md frontmatter line ${number} has unexpected or duplicate top-level key: ${key}.`);
      }
      topIndex += 1;
      if (key === "metadata") {
        if (rawValue !== undefined) {
          throw new Error("SKILL.md metadata must be a mapping, not a scalar.");
        }
        inMetadata = true;
        frontmatter.metadata = {};
      } else {
        if (inMetadata || rawValue === undefined || rawValue === "") {
          throw new Error(`SKILL.md frontmatter key ${key} must have a scalar value.`);
        }
        frontmatter[key] = parseYamlScalar(rawValue, number);
      }
      continue;
    }
    if (nested) {
      const [, key, rawValue] = nested;
      if (!inMetadata || key !== expectedMetadata[metadataIndex]) {
        throw new Error(`SKILL.md frontmatter line ${number} has unexpected, duplicate, or misplaced nested key: ${key}.`);
      }
      metadataIndex += 1;
      frontmatter.metadata[key] = parseYamlScalar(rawValue, number);
      continue;
    }
    throw new Error(`SKILL.md frontmatter line ${number} has unsupported YAML structure.`);
  }

  if (topIndex !== expectedTopLevel.length || metadataIndex !== expectedMetadata.length) {
    throw new Error("SKILL.md frontmatter must define name, description, license, metadata.author, and metadata.version exactly once.");
  }
  return { frontmatter, body: lines.slice(closingIndex + 1) };
}

function parseYamlScalar(value, lineNumber) {
  if (value.startsWith('"')) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed !== "string") throw new Error("not a string");
      return parsed;
    } catch {
      throw new Error(`SKILL.md frontmatter line ${lineNumber} has an invalid double-quoted scalar.`);
    }
  }
  if (value.startsWith("'")) {
    const match = value.match(/^'((?:[^']|'')*)'$/);
    if (!match) throw new Error(`SKILL.md frontmatter line ${lineNumber} has an invalid single-quoted scalar.`);
    return match[1].replaceAll("''", "'");
  }
  if (!/^[^\s#][^#]*\S$|^[^\s#]$/.test(value) || /[:[\]{}&,*!|>@`]/.test(value)) {
    throw new Error(`SKILL.md frontmatter line ${lineNumber} has an unsupported plain scalar.`);
  }
  return value;
}

export function validateRequiredSections(body) {
  const occurrences = new Map(requiredSections.map((section) => [section, []]));
  let fence = null;

  for (let index = 0; index < body.length; index += 1) {
    const line = body[index];
    const fenceMatch = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!fence) fence = { character: marker[0], length: marker.length };
      else if (marker[0] === fence.character && marker.length >= fence.length) fence = null;
      continue;
    }
    if (fence) continue;
    for (const section of requiredSections) {
      if (line === `## ${section}`) occurrences.get(section).push(index + 1);
    }
  }

  const positions = [];
  for (const section of requiredSections) {
    const matches = occurrences.get(section);
    if (matches.length !== 1) {
      throw new Error(`SKILL.md must contain exactly one level-2 heading: ## ${section}.`);
    }
    positions.push(matches[0]);
  }
  for (let index = 1; index < positions.length; index += 1) {
    if (positions[index] <= positions[index - 1]) {
      throw new Error(`SKILL.md required level-2 headings are out of order at: ${requiredSections[index]}.`);
    }
  }
}

export function decodeLocalDestination(destination) {
  try {
    return decodeURIComponent(destination.split(/[?#]/, 1)[0]);
  } catch {
    throw new Error(`Malformed percent encoding in local Markdown target: ${destination}.`);
  }
}

function walk(directory, predicate) {
  const results = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", ".codegraph"].includes(entry.name)) continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) results.push(...walk(path, predicate));
    else if (predicate(path)) results.push(path);
  }
  return results;
}

function validateLocalTarget(markdownPath, destination, fail) {
  if (!destination || destination.startsWith("#") || /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(destination)) {
    return;
  }
  let localPath;
  try {
    localPath = decodeLocalDestination(destination);
  } catch (error) {
    fail(`${relative(root, markdownPath)}: ${error.message}`);
    return;
  }
  if (!localPath) return;

  const target = localPath.startsWith("/")
    ? resolve(root, `.${localPath}`)
    : resolve(dirname(markdownPath), localPath);
  const targetRelative = relative(root, target);
  if (
    targetRelative === ".." ||
    targetRelative.startsWith(`..${sep}`) ||
    !existsSync(target)
  ) {
    fail(`${relative(root, markdownPath)} links to a missing local path: ${destination}.`);
  }
}

function validateLocalMarkdownLinks(fail) {
  const markdownFiles = walk(root, (path) => extname(path).toLowerCase() === ".md");
  const inlinePattern = /!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))[^)]*\)/g;
  const referencePattern = /^ {0,3}\[[^\]]+\]:\s*(?:<([^>]+)>|([^\s]+))(?:\s+.*)?$/gm;

  for (const markdownPath of markdownFiles) {
    const content = readFileSync(markdownPath, "utf8");
    for (const match of content.matchAll(inlinePattern)) {
      validateLocalTarget(markdownPath, match[1] ?? match[2], fail);
    }
    for (const match of content.matchAll(referencePattern)) {
      validateLocalTarget(markdownPath, match[1] ?? match[2], fail);
    }
  }
}

function runNpmPack(packageName, fail) {
  const result = spawnSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  if (result.error) {
    fail(`Could not run npm pack --dry-run --json: ${result.error.message}`);
    return [];
  }
  if (result.status !== 0) {
    fail(`npm pack --dry-run --json failed with exit ${result.status}: ${(result.stderr || result.stdout).trim()}`);
    return [];
  }

  let output;
  try {
    output = JSON.parse(result.stdout);
  } catch (error) {
    fail(`npm pack --dry-run --json returned invalid JSON: ${error.message}`);
    return [];
  }

  let entries = [];
  if (Array.isArray(output)) {
    entries = output;
  } else if (output && typeof output === "object" && Array.isArray(output.files)) {
    entries = [output];
  } else if (output && typeof output === "object") {
    entries = Object.values(output).filter(
      (entry) => entry && typeof entry === "object" && Array.isArray(entry.files),
    );
  }

  const entry = entries.find((candidate) => candidate.name === packageName);
  if (!entry?.files) {
    fail(`npm pack --dry-run --json returned no files for ${packageName}.`);
    return [];
  }
  return entry.files.map((file) => (typeof file === "string" ? file : file.path));
}

export function compareTarballFiles(actualFiles, expectedFiles) {
  const errors = [];
  const expected = new Set(expectedFiles);
  const actual = new Set();
  for (const file of actualFiles) {
    if (typeof file !== "string" || !file) errors.push("npm pack --dry-run --json returned a file without a path.");
    else if (actual.has(file)) errors.push(`npm pack --dry-run --json returned a duplicate file path: ${file}.`);
    else actual.add(file);
  }
  for (const file of expected) {
    if (!actual.has(file)) errors.push(`npm package is missing allowlisted file: ${file}.`);
  }
  for (const file of actual) {
    if (!expected.has(file)) errors.push(`npm package contains a non-allowlisted file: ${file}.`);
  }
  return errors;
}

function validateTarball(packageName, fail) {
  const packedFiles = runNpmPack(packageName, fail);
  if (packedFiles.length === 0) return;

  const expectedFiles = [
    "LICENSE",
    "README.md",
    "package.json",
    "skills/mobile-agent-orchestrator/SKILL.md",
    "skills/mobile-agent-orchestrator/references/guided-install.md",
    "skills/mobile-agent-orchestrator/references/platform-matrix.md",
    "skills/mobile-agent-orchestrator/references/verification-and-recovery.md",
  ];
  for (const error of compareTarballFiles(packedFiles, expectedFiles)) fail(error);
}

function validatePackage() {
  const errors = [];
  const fail = (message) => errors.push(message);
  const packagePath = resolve(root, "package.json");
  const skillPath = resolve(root, "skills/mobile-agent-orchestrator/SKILL.md");
  const changelogPath = resolve(root, "CHANGELOG.md");
  const readmePath = resolve(root, "README.md");
  let packageJson = null;

  try {
    packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
  } catch (error) {
    fail(`package.json must contain valid JSON: ${error.message}`);
  }

  if (packageJson) {
    const expectedRepository = "https://github.com/egdev6/mobile-agent-orchestrator";
    const version = parseSemVer(packageJson.version);
    if (packageJson.name !== "mobile-agent-orchestrator") fail("package.json name must be mobile-agent-orchestrator.");
    if (typeof packageJson.description !== "string" || !packageJson.description.trim()) fail("package.json must include a non-empty description.");
    if (packageJson.license !== "Apache-2.0") fail("package.json license must be Apache-2.0.");
    if (!version) fail(`package.json version must be valid SemVer; received ${JSON.stringify(packageJson.version)}.`);
    if (version && version.prerelease.length === 0 && version.build.length > 0) {
      fail("Stable package versions must not contain build metadata.");
    }
    if (typeof packageJson.author !== "string" || !packageJson.author.trim()) fail("package.json must include a non-empty public author string.");

    const repositoryUrl = typeof packageJson.repository === "string" ? packageJson.repository : packageJson.repository?.url;
    const normalizedRepository = repositoryUrl?.replace(/^git\+/, "").replace(/\.git$/, "");
    if (normalizedRepository !== expectedRepository) fail(`package.json repository must be ${expectedRepository}.`);
    if (packageJson.homepage !== expectedRepository) fail(`package.json homepage must be ${expectedRepository}.`);
    if (packageJson.bugs?.url !== `${expectedRepository}/issues`) fail(`package.json bugs.url must be ${expectedRepository}/issues.`);
    if (!Array.isArray(packageJson.files) || packageJson.files.length !== 1 || packageJson.files[0] !== "skills/") {
      fail('package.json files must allowlist only "skills/".');
    }
    const requiredKeywords = ["pi-package", "pi-skill", "mobile-agent", "tailscale", "mosh"];
    if (!Array.isArray(packageJson.keywords) || requiredKeywords.some((keyword) => !packageJson.keywords.includes(keyword))) {
      fail("package.json keywords must preserve the Pi and mobile-agent discovery terms.");
    }
    if (!Array.isArray(packageJson.pi?.skills) || packageJson.pi.skills.length === 0) {
      fail("package.json pi.skills must be a non-empty array.");
    } else {
      for (const target of packageJson.pi.skills) {
        const resolvedTarget = typeof target === "string" ? resolve(root, target) : "";
        const targetRelative = resolvedTarget && relative(root, resolvedTarget);
        if (typeof target !== "string" || targetRelative === ".." || targetRelative.startsWith(`..${sep}`) || !existsSync(resolvedTarget)) {
          fail(`package.json pi.skills target does not exist inside the package: ${JSON.stringify(target)}.`);
        }
      }
    }
  }

  if (existsSync(skillPath)) {
    try {
      const parsedSkill = parseSkillFrontmatter(readFileSync(skillPath, "utf8"));
      const { frontmatter } = parsedSkill;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(frontmatter.name) || frontmatter.name.length > 64) {
        fail("SKILL.md name must be 1-64 lowercase letters, numbers, and single hyphens.");
      }
      if (!frontmatter.description || frontmatter.description.length > 1024) {
        fail("SKILL.md description must be non-empty and at most 1024 characters.");
      }
      if (frontmatter.license !== "Apache-2.0") fail("SKILL.md license must be Apache-2.0.");
      if (!frontmatter.metadata.author) fail("SKILL.md metadata.author must be non-empty.");
      if (packageJson && frontmatter.metadata.version !== packageJson.version) {
        fail(`SKILL.md metadata.version (${frontmatter.metadata.version}) must equal package.json version (${packageJson.version}).`);
      }
      validateRequiredSections(parsedSkill.body);
    } catch (error) {
      fail(error.message);
    }
  } else {
    fail("Pi skill manifest is missing: skills/mobile-agent-orchestrator/SKILL.md.");
  }

  validateLocalMarkdownLinks(fail);

  if (packageJson && !packageJson.version.includes("-")) {
    const changelog = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : "";
    const readme = existsSync(readmePath) ? readFileSync(readmePath, "utf8") : "";
    const escapedVersion = packageJson.version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!new RegExp(`^##\\s+(?:\\[${escapedVersion}\\]|${escapedVersion})(?:\\s|$)`, "m").test(changelog)) {
      fail(`Stable version ${packageJson.version} requires a matching CHANGELOG.md heading.`);
    }
    if (/\*\*Status:\s*draft\.\*\*/i.test(readme)) fail("Stable versions must remove the README draft marker.");
    if (/<owner>|<tag>/.test(readme)) fail("Stable versions must replace README <owner> and <tag> placeholders.");
  }

  if (packageJson) validateTarball(packageJson.name, fail);

  if (errors.length > 0) {
    console.error("Package validation failed:");
    for (const error of errors) console.error(`- ${error}`);
    return 1;
  }
  console.log("Package validation passed.");
  return 0;
}

function main() {
  if (process.argv[2] === "--release-transition") {
    try {
      assertReleaseTransition(process.argv[3], process.argv[4]);
      console.log(`Valid release transition: ${process.argv[3]} -> ${process.argv[4]}.`);
      return 0;
    } catch (error) {
      console.error(`Invalid release transition: ${error.message}`);
      return 1;
    }
  }
  return validatePackage();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = main();
}
