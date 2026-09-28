const { spawn } = require("child_process");
const path = require('path');

const SCRIPT_FILE = "auto.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const RESTART_DELAY = 2000; // 2 segundo lang — mabilis bumalik

let isRunning = false;
let restartCount = 0;

function start() {
    if (isRunning) return;
    isRunning = true;
    restartCount++;

    console.log(`\n🔥 SAIZEN BOT — WALANG HANGGAN`);
    console.log(`🚀 Pumapasok: ${SCRIPT_FILE}`);
    console.log(`🔄 Restart #${restartCount}`);
    console.log(`===============================`);

    const main = spawn("node", [SCRIPT_PATH], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true
    });

    main.on("close", (exitCode) => {
        isRunning = false;
        console.log(`\n🔴 Tumigil — exit code: ${exitCode}`);
        console.log(`⏳ Babalik sa ${RESTART_DELAY/1000}s...`);
        setTimeout(start, RESTART_DELAY); // ✅ LAGI BUMABALIK — WALANG LIMIT
    });

    main.on("error", (err) => {
        isRunning = false;
        console.error(`❌ Error: ${err.message}`);
        setTimeout(start, RESTART_DELAY); // ✅ Kahit error — BUMABALIK
    });
}

process.on("SIGINT", () => {
    console.log("\n🛑 Pinapatay...");
    process.exit(0);
});

start(); // ✅ SIMULA — WALANG HANGGAN
