import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  canonicalSkillPath,
  canonicalSkillRoot,
  compareSemVer,
  compareTarballFiles,
  assertReleaseTransition,
  decodeLocalDestination,
  discoverPackageInventory,
  parseSemVer,
  parseSkillFrontmatter,
  validatePublishedInventory,
  validateRequiredSections,
  publishedTopLevelPaths,
} from "../scripts/validate-package.mjs";

test("parses and compares SemVer, including prerelease precedence", () => {
  assert.deepEqual(parseSemVer("1.2.3-alpha.1+build.7"), {
    major: "1", minor: "2", patch: "3", prerelease: ["alpha", "1"], build: ["build", "7"],
  });
  assert.equal(parseSemVer("01.2.3"), null);
  assert.equal(compareSemVer("1.0.0-alpha", "1.0.0"), -1);
  assert.equal(compareSemVer("1.0.0-2", "1.0.0-10"), -1);
  assert.equal(compareSemVer("1.0.0+one", "1.0.0+two"), 0);
  assert.throws(() => compareSemVer("bad", "1.0.0"), /valid SemVer/);
});

test("validates stable, increasing release transitions", () => {
  assert.doesNotThrow(() => assertReleaseTransition("0.1.0", "0.1.1"));
  assert.throws(() => assertReleaseTransition("0.1.0", "0.1.0"), /strictly increase/);
  assert.throws(() => assertReleaseTransition("0.1.0", "0.1.1-rc.1"), /stable/);
  assert.throws(() => assertReleaseTransition("0.1.0", "0.1.1+build"), /build metadata/);
});

test("parses valid frontmatter and rejects malformed structure", () => {
  const skill = `---\nname: example-skill\ndescription: "A useful skill"\nlicense: MIT\nmetadata:\n  author: 'Example''s team'\n  version: 1.0.0\n---\n# Body`;
  const parsed = parseSkillFrontmatter(skill);
  assert.equal(parsed.frontmatter.metadata.author, "Example's team");
  assert.equal(parsed.frontmatter.version, undefined);
  assert.throws(() => parseSkillFrontmatter(skill.replace("  version: 1.0.0", " version: 1.0.0")), /unsupported YAML/);
  assert.throws(() => parseSkillFrontmatter(skill.replace('description: "A useful skill"', "description: [bad]")), /unsupported plain scalar/);
});

test("requires each section once, in order, outside code fences", () => {
  const sections = ["Activation Contract", "Hard Rules", "Decision Gates", "Execution Steps", "Output Contract", "References"];
  const body = sections.map((section) => `## ${section}`).join("\n").split("\n");
  assert.doesNotThrow(() => validateRequiredSections(body));
  assert.throws(() => validateRequiredSections(["## Activation Contract", ...body]), /exactly one/);
  assert.throws(() => validateRequiredSections([...body].reverse()), /out of order/);
  assert.doesNotThrow(() => validateRequiredSections(["```", "## Activation Contract", "```", ...body]));
});

test("decodes local Markdown destinations and rejects malformed encodings", () => {
  assert.equal(decodeLocalDestination("references/a%20b.md?x=1"), "references/a b.md");
  assert.equal(decodeLocalDestination("#section"), "");
  assert.throws(() => decodeLocalDestination("bad%2"), /Malformed percent encoding/);
});

test("compares tarball files as an exact allowlist", () => {
  const expected = ["LICENSE", canonicalSkillPath];
  assert.deepEqual(compareTarballFiles(expected, expected), []);
  assert.match(compareTarballFiles(["LICENSE", "unexpected"], expected).join("\n"), /non-allowlisted/);
  assert.match(compareTarballFiles(["LICENSE", "LICENSE"], expected).join("\n"), /duplicate/);
  assert.match(validatePublishedInventory(["LICENSE"], expected).join("\n"), /missing/);
});

test("discovers recursive skill files and enforces the publication boundary", () => {
  const packageRoot = mkdtempSync(join(tmpdir(), "package-validation-"));
  const skillRoot = join(packageRoot, canonicalSkillRoot);
  mkdirSync(join(skillRoot, "references", "nested"), { recursive: true });
  writeFileSync(join(skillRoot, "SKILL.md"), "");
  writeFileSync(join(skillRoot, "references", "nested", "extra.md"), "");
  assert.deepEqual(discoverPackageInventory(packageRoot), [
    "LICENSE", "README.md", "package.json", canonicalSkillPath, "skills/mobile-agent-orchestrator/references/nested/extra.md",
  ]);
  assert.deepEqual(publishedTopLevelPaths, ["LICENSE", "README.md", "package.json", "skills/"]);
  assert.throws(() => {
    writeFileSync(join(skillRoot, "references", "nested", "SKILL.md"), "");
    discoverPackageInventory(packageRoot);
  }, /exactly one canonical SKILL.md/);
});

test("expands recursively allowlisted non-skill directories", () => {
  const packageRoot = mkdtempSync(join(tmpdir(), "package-validation-"));
  const originalPaths = [...publishedTopLevelPaths];
  try {
    const skillRoot = join(packageRoot, canonicalSkillRoot);
    mkdirSync(skillRoot, { recursive: true });
    writeFileSync(join(skillRoot, "SKILL.md"), "");
    mkdirSync(join(packageRoot, "bin"), { recursive: true });
    writeFileSync(join(packageRoot, "bin", "tool.js"), "");
    publishedTopLevelPaths.push("bin/");

    assert.deepEqual(discoverPackageInventory(packageRoot), [
      "LICENSE", "README.md", "package.json", canonicalSkillPath, "bin/tool.js",
    ]);
  } finally {
    publishedTopLevelPaths.splice(0, publishedTopLevelPaths.length, ...originalPaths);
    rmSync(packageRoot, { recursive: true, force: true });
  }
});
