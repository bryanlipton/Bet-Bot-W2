import { execSync } from "child_process";
import fs from "fs";
import path from "path";

console.log("🚀 Bet Bot Production Deployment");
console.log("================================");

try {
  // Step 1: Build the application
  console.log("🏗️  Building application...");
  execSync("npm run build", { stdio: "inherit" });

  // Step 2: Ensure static files are in correct location
  console.log("📁 Setting up static files...");
  const distPublicPath = path.join(process.cwd(), 'dist', 'public');
  const serverPublicPath = path.join(process.cwd(), 'server', 'public');

  if (fs.existsSync(distPublicPath)) {
    // Create server/public directory if it doesn't exist
    if (!fs.existsSync(serverPublicPath)) {
      fs.mkdirSync(serverPublicPath, { recursive: true });
    }
    
    // Copy files
    execSync(`cp -r ${distPublicPath}/* ${serverPublicPath}/`, { stdio: "inherit" });
    console.log("✅ Static files copied successfully");
  }

  // Step 3: Start production server
  console.log("🚀 Starting production server...");
  process.env.NODE_ENV = "production";
  execSync("node dist/index.js", { stdio: "inherit" });

} catch (err) {
  console.error("❌ Deployment failed:", err.message);
  process.exit(1);
}