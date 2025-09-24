#!/usr/bin/env node

import { execSync } from "child_process";
import { createInterface } from "readline";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

function confirm(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

function executeCommand(command, options = {}) {
  try {
    console.log(`📝 Executing: ${command}`);
    return execSync(command, {
      stdio: "inherit",
      shell: true,
      encoding: "utf8",
      ...options,
    });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function appendReleaseNotes(version, notes, filePath) {
  // Escape markdown special characters in notes
  const escapedNotes = notes
    .replace(/\\/g, "\\\\") // Escape backslashes first
    .replace(/\*/g, "\\*") // Escape asterisks
    .replace(/`/g, "\\`") // Escape backticks
    .replace(/_/g, "\\_") // Escape underscores
    .replace(/\[/g, "\\[") // Escape square brackets
    .replace(/\]/g, "\\]") // Escape square brackets
    .replace(/</g, "&lt;") // Escape HTML tags
    .replace(/>/g, "&gt;");

  const currentDate = new Date().toISOString().split("T")[0];
  const releaseEntry = `### ${version} (${currentDate})\n\n${escapedNotes}\n\n---\n\n`;

  try {
    let content = "";
    if (existsSync(filePath)) {
      content = readFileSync(filePath, "utf8");
    }

    // Prepend new release to the top of the file
    const newContent = releaseEntry + content;
    writeFileSync(filePath, newContent);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    throw new Error(`Failed to update release notes: ${error.message}`);
  }
}

function calculateNewVersion(currentVersion, type) {
  const parts = currentVersion.split(".").map((num) => parseInt(num, 10));

  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${currentVersion}`);
  }

  const [major, minor, patch] = parts;

  switch (type) {
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "major":
      return `${major + 1}.0.0`;
    default:
      throw new Error(`Invalid version type: ${type}`);
  }
}

function validateGitStatus() {
  try {
    // Check if we're in a git repository
    executeCommand("git rev-parse --git-dir", { stdio: "pipe" });

    // Check for uncommitted changes
    const status = executeCommand("git status --porcelain", { stdio: "pipe" });
    if (status && status.trim()) {
      console.warn("⚠️  Warning: You have uncommitted changes.");
      process.stdout.write("Current git status: ");
      console.log(status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn("⚠️  Warning: Git validation failed:", error.message);
    return false;
  }
}

function loadPackageJson(packagePath) {
  try {
    const packageJsonPath = join(packagePath, "package.json");
    if (!existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at ${packageJsonPath}`);
    }

    const content = readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(content);

    if (!packageJson.version) {
      throw new Error("No version field found in package.json");
    }

    return packageJson;
  } catch (error) {
    throw new Error(`Failed to load package.json: ${error.message}`);
  }
}

async function main() {
  try {
    console.log("🚀 Release Script\n");

    // Configuration
    const BACKEND_PATH = "backend";
    const RELEASE_NOTES_PATH = join(BACKEND_PATH, "release-notes.md");

    // Validate git status
    const gitIsClean = validateGitStatus();
    if (!gitIsClean) {
      const shouldContinue = await confirm("Continue anyway?");
      if (!shouldContinue) {
        console.log("❌ Release cancelled");
        process.exit(0);
      }
    }

    // Load current package.json
    const packageJson = loadPackageJson(BACKEND_PATH);
    const currentVersion = packageJson.version;
    console.log(`📦 Current version: ${currentVersion}`);

    // Prompt for release notes
    const notes = await prompt("Enter release notes: ");
    if (!notes) {
      console.error("❌ Release notes are required");
      process.exit(1);
    }

    // Prompt for version type
    console.log("\nVersion types: patch, minor, major");
    const type = await prompt("Enter version type: ");

    // Validate version type
    const validTypes = ["patch", "minor", "major"];
    if (!validTypes.includes(type)) {
      console.error(
        "❌ Invalid version type. Must be one of:",
        validTypes.join(", ")
      );
      process.exit(1);
    }

    // Calculate new version
    const newVersion = calculateNewVersion(currentVersion, type);

    // Prompt for commit message
    const defaultCommitMessage = `Release ${newVersion}`;
    const message =
      (await prompt(`Enter commit message (${defaultCommitMessage}): `)) ||
      defaultCommitMessage;

    console.log("\n📋 Summary:");
    console.log(`Current Version: ${currentVersion}`);
    console.log(`New Version: ${newVersion}`);
    console.log(`Notes: ${notes}`);
    console.log(`Version Type: ${type}`);
    console.log(`Commit Message: ${message}`);

    const shouldProceed = await confirm("\nProceed with release?");
    if (!shouldProceed) {
      console.log("❌ Release cancelled");
      process.exit(0);
    }

    rl.close();

    console.log("\n🔄 Executing release steps...\n");
    console.log("─".repeat(50));

    // Step 1: Update release notes
    console.log("1️⃣ Updating release notes...");
    appendReleaseNotes(newVersion, notes, RELEASE_NOTES_PATH);

    // Step 2: Update package version and publish
    console.log("2️⃣ Updating package version...");
    executeCommand(`cd ${BACKEND_PATH} && pnpm version ${type}`);

    console.log("3️⃣ Publishing package...");
    executeCommand(`cd ${BACKEND_PATH} && pnpm publish`);

    // Step 3: Git operations
    console.log("4️⃣ Committing changes...");
    executeCommand("git add .");
    executeCommand(`git commit -m "${message}"`);

    console.log("5️⃣ Pushing changes...");
    executeCommand("git push");

    // Step 4: Create git tag (optional but recommended)
    console.log("6️⃣ Creating git tag...");
    executeCommand(`git tag -a v${newVersion} -m "Release ${newVersion}"`);
    executeCommand(`git push origin v${newVersion}`);

    console.log("\n✅ Release completed successfully!");
    console.log(
      `🎉 Version ${newVersion} has been published and pushed to git`
    );
  } catch (error) {
    console.error("\n❌ Error during release:", error.message);

    // Cleanup suggestions
    console.log("\n🔧 Cleanup suggestions:");
    console.log("- Check git status: git status");
    console.log("- Reset if needed: git reset --hard HEAD~1");
    console.log(
      "- Check published packages: pnpm view your-package versions --json"
    );

    process.exit(1);
  }
}

main();
