const { spawn } = require("child_process");

function run(command) {
  const child = spawn(command, {
    shell: true,
    stdio: "inherit",
  });
  return child;
}

const syncProc = run("npm run db:watch:supabase");
const devProc = run("npm run dev");

let shuttingDown = false;

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (syncProc && !syncProc.killed) syncProc.kill();
  if (devProc && !devProc.killed) devProc.kill();

  process.exit(exitCode);
}

syncProc.on("exit", (code) => {
  if (code !== 0) shutdown(code || 1);
});

devProc.on("exit", (code) => {
  shutdown(code || 0);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
