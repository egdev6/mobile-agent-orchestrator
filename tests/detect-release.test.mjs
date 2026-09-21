import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import test from "node:test";

import { assertReleaseTransition } from "../scripts/validate-package.mjs";
import { detectReleaseTransition } from "../scripts/detect-release.mjs";

const detector = new URL("../scripts/detect-release.mjs", import.meta.url);

test("unchanged valid versions are ordinary merges", () => {
  assert.deepEqual(detectReleaseTransition("0.1.0", "0.1.0"), { shouldTag: false });
});

test("stable increases are taggable", () => {
  assert.deepEqual(detectReleaseTransition("0.1.0", "0.2.0"), {
    shouldTag: true,
    version: "0.2.0",
  });
});

test("strict validation rejects equal and lower transitions", () => {
  assert.throws(() => assertReleaseTransition("0.1.0", "0.1.0"), /strictly increase/);
  assert.throws(() => detectReleaseTransition("0.2.0", "0.1.0"), /strictly increase/);
});

test("invalid versions are rejected", () => {
  assert.throws(() => detectReleaseTransition("not-semver", "0.2.0"), /Base version is not valid SemVer/);
  assert.throws(() => detectReleaseTransition("0.1.0", "1.0"), /Release version is not valid SemVer/);
});

test("prerelease and build metadata transitions are rejected", () => {
  assert.throws(() => detectReleaseTransition("0.1.0", "0.2.0-rc.1"), /must be stable/);
  assert.throws(() => detectReleaseTransition("0.1.0", "0.2.0+build.1"), /must not contain build metadata/);
});

test("CLI emits GitHub output for unchanged and taggable versions", () => {
  const unchanged = spawnSync(process.execPath, [detector.pathname, "0.1.0", "0.1.0"], { encoding: "utf8" });
  assert.equal(unchanged.status, 0);
  assert.equal(unchanged.stdout, "should_tag=false\n");

  const increased = spawnSync(process.execPath, [detector.pathname, "0.1.0", "0.2.0"], { encoding: "utf8" });
  assert.equal(increased.status, 0);
  assert.equal(increased.stdout, "should_tag=true\nversion=0.2.0\n");
});

test("CLI reports invalid transitions and exits nonzero", () => {
  const result = spawnSync(process.execPath, [detector.pathname, "0.2.0", "0.1.0"], { encoding: "utf8" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid release transition: .*strictly increase/);
});
