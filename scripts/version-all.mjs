import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const bumps = new Set(["patch", "minor", "major"]);
const args = process.argv.slice(2);
const bump = args.find((arg) => bumps.has(arg));
const dryRun = args.includes("--dry-run");

if (!bump) {
  throw new Error("Usage: node scripts/version-all.mjs <patch|minor|major> [--dry-run]");
}

const packagePaths = [
  "package.json",
  "packages/sdk/package.json",
  "packages/react-query/package.json",
];

const rootPackage = await readJson("package.json");
const nextVersion = bumpVersion(rootPackage.version, bump);

for (const packagePath of packagePaths) {
  const packageJson = await readJson(packagePath);
  packageJson.version = nextVersion;

  if (packageJson.name === "@aredotna/react-query") {
    packageJson.peerDependencies = {
      ...packageJson.peerDependencies,
      "@aredotna/sdk": `^${nextVersion}`,
    };
  }

  if (dryRun) {
    console.log(`[dry-run] ${packagePath} -> ${nextVersion}`);
    continue;
  }

  await writeJson(packagePath, packageJson);
}

console.log(nextVersion);

async function readJson(path) {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

async function writeJson(path, value) {
  await writeFile(resolve(path), `${JSON.stringify(value, null, 2)}\n`);
}

function bumpVersion(version, bump) {
  const parts = version.split(".").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part) || part < 0)) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  const [major, minor, patch] = parts;
  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error(`Invalid bump: ${bump}`);
  }
}
