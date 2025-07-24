// scripts/deploy-start.js

import { execSync } from "child_process";

try {
  console.log("📦 Installing dependencies...");
  execSync("npm install", { stdio: "inherit" });

  console.log("⚙️ Building frontend...");
  execSync("vite build", { stdio: "inherit" });

  console.log("🧠 Building backend...");
  execSync(
    "esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.js",
    { stdio: "inherit" },
  );

  console.log("🚀 Starting server...");
  execSync("node dist/index.js", { stdio: "inherit" });
} catch (err) {
  console.error("❌ Deployment failed:", err);
  process.exit(1);
}
