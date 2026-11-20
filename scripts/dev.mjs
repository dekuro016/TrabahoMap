// npm run dev → rebuilds the site on every save AND runs the server (with AI endpoints).
// Refresh the browser after saving a file.
import { spawn } from "node:child_process";

const run = (args) => spawn(process.execPath, args, { stdio: "inherit" });
const builder = run(["scripts/build.mjs", "--watch"]);
setTimeout(() => {
  const server = run(["--watch-path=server", "--watch-path=shared", "server/index.mjs"]);
  const stop = () => {
    builder.kill();
    server.kill();
    process.exit();
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}, 1500);
