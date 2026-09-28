const { spawn } = require("child_process");
const path = require('path');

// ⚙️ Settings
const SCRIPT_FILE = "auto.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const RESTART_DELAY = 3000; // 3 segundo bago mag-restart
const MAX_RESTARTS = 50; // Walang hanggan kung mataas

let restartCount = 0;
let isRunning = false;

function start() {
    if (isRunning) return;
    isRunning = true;
    restartCount++;

    console.log(`\n🚀 [${new Date().toLocaleString('en-PH')}] Pumapasok: ${SCRIPT_FILE}`);
    console.log(`🔄 Restart count: ${restartCount}`);

    const main = spawn("node", [SCRIPT_PATH], {
        cwd: __dirname,
        stdio: "inherit",
        shell: true,
        env: { ...process.env, NODE_ENV: 'production' }
    });

    main.on("error", (err) => {
        console.error(`❌ Error sa process: ${err.message}`);
        isRunning = false;
        scheduleRestart();
    });

    main.on("close", (exitCode) => {
        isRunning = false;
        
        if (exitCode === 0) {
            console.log(`✅ Tumigil nang maayos — exit code 0`);
            // Hindi na restart kung maayos na tumigil
            return;
        }
        
        console.log(`🔴 Tumigil — exit code: ${exitCode}`);
        scheduleRestart();
    });
}

function scheduleRestart() {
    if (restartCount > MAX_RESTARTS) {
        console.log(`⚠️ Sobrang daming restart — hihinto muna. I-restart mo nang mano-mano.`);
        return;
    }
    
    console.log(`⏳ Magre-restart sa ${RESTART_DELAY/1000} segundo...`);
    setTimeout(start, RESTART_DELAY);
}

// Siguraduhin na iisang instance lang
process.on("SIGINT", () => {
    console.log("\n🛑 Pinapatay...");
    process.exit(0);
});

console.log("🔥 SAIZEN BOT — AUTO-RESTART MANAGER");
console.log("====================================");
start();
