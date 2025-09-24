#!/usr/bin/env node

import { execSync } from "child_process";
import { createInterface } from "readline";

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

try {
  console.log("🚀 Release Script\n");

  // Prompt for release notes
  const notes = await prompt("Enter release notes: ");

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

  // Prompt for commit message
  const message = await prompt("Enter commit message: ");

  rl.close();

  console.log("\n📋 Summary:");
  console.log(`Notes: ${notes}`);
  console.log(`Version Type: ${type}`);
  console.log(`Commit Message: ${message}`);

  const confirm = await new Promise((resolve) => {
    const confirmRl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    confirmRl.question("\nProceed with release? (y/N): ", (answer) => {
      confirmRl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });

  if (!confirm) {
    console.log("❌ Release cancelled");
    process.exit(0);
  }

  console.log("\n🔄 Executing release steps...\n");

  // Execute the command with proper escaping
  const command = `cd backend && echo "${notes.replace(
    /"/g,
    '\\"'
  )}\\n" >> release-notes.md && pnpm version ${type} && pnpm publish && cd ../../ && git add . && git commit -m "${message.replace(
    /"/g,
    '\\"'
  )}" && git push`;

  console.log("Executing:", command);
  console.log("─".repeat(50));

  execSync(command, {
    stdio: "inherit",
    shell: true,
    env: {
      ...process.env,
      npm_config_notes: notes,
      npm_config_type: type,
      npm_config_message: message,
    },
  });

  console.log("\n✅ Release completed successfully!");
} catch (error) {
  console.error("\n❌ Error during release:", error.message);
  process.exit(1);
}
