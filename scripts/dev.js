import { spawn } from "child_process";

console.log("🚀 Starting Smart Travel Planner (Vite + Express Server)...");

const isWindows = process.platform === "win32";
const npmCmd = isWindows ? "npm.cmd" : "npm";
const npxCmd = isWindows ? "npx.cmd" : "npx";

// Start Vite dev server on port 3000
const viteProcess = spawn(npmCmd, ["run", "vite-only"], {
  stdio: "inherit",
  shell: true,
});

// Start Express backend server on port 5000
const serverProcess = spawn(npxCmd, ["tsx", "watch", "server/index.ts"], {
  stdio: "inherit",
  shell: true,
});

const cleanup = () => {
  console.log("\n👋 Stopping all services...");
  try {
    viteProcess.kill();
  } catch (e) {}
  try {
    serverProcess.kill();
  } catch (e) {}
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
process.on("exit", cleanup);

viteProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Vite exited with code ${code}`);
    cleanup();
  }
});

serverProcess.on("exit", (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Express server exited with code ${code}`);
    cleanup();
  }
});
