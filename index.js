const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const SCRIPT_FILE = "auto.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);
const APPSTATE_PATH = path.join(__dirname, "appstate.json"); // Palitan batay sa path ng appstate mo

const RESTART_DELAY = 3000;
const RELOGIN_DELAY = 10000; // Mas mahabang delay kapag relogin para iwas FB rate limit

// Exit Codes para sa Communication
const EXIT_CODES = {
    NORMAL_RESTART: 1,
    RELOGIN_REQUIRED: 2, // Gagamitin kapag expired o namatay ang session
};

let child = null;
let restartTimer = null;
let shuttingDown = false;

function cleanCorruptedAppState() {
    try {
        if (fs.existsSync(APPSTATE_PATH)) {
            console.log("[INDEX] Cleaning up existing AppState for fresh login...");
            // Opsyonal: I-rename muna bilang backup o burahin na para mag-trigger ng panibagong login sa auto.js
            // fs.unlinkSync(APPSTATE_PATH); 
        }
    } catch (err) {
        console.error("[INDEX] Error cleaning AppState:", err.message);
    }
}

function start() {
    if (shuttingDown) return;

    console.log("\n========================================");
    console.log("          STARTING AUTO.JS");
    console.log("========================================\n");

    child = spawn(process.execPath, [SCRIPT_PATH], {
        cwd: __dirname,
        stdio: "inherit",
        shell: false,
        windowsHide: true
    });

    child.on("error", (error) => {
        console.error(`[INDEX] Failed to start auto.js: ${error.message}`);
        scheduleRestart(RESTART_DELAY);
    });

    child.on("close", (exitCode, signal) => {
        child = null;

        if (shuttingDown) return;

        console.log(
            `[INDEX] auto.js stopped. Exit code: ${exitCode}, signal: ${signal || "none"}`
        );

        // KONTROL SA RE-LOGIN BASE SA EXIT CODE
        if (exitCode === EXIT_CODES.RELOGIN_REQUIRED) {
            console.log("[INDEX] Re-login signal detected! Preparing session refresh...");
            cleanCorruptedAppState();
            scheduleRestart(RELOGIN_DELAY);
        } else {
            // Normal crash o network glitch lang
            scheduleRestart(RESTART_DELAY);
        }
    });
}

function scheduleRestart(delay = RESTART_DELAY) {
    if (shuttingDown || restartTimer) return;

    console.log(`[INDEX] Restarting auto.js in ${delay / 1000} seconds...`);

    restartTimer = setTimeout(() => {
        restartTimer = null;
        start();
    }, delay);
}

function shutdown(signal) {
    if (shuttingDown) return;

    shuttingDown = true;
    console.log(`[INDEX] ${signal} received. Stopping process...`);

    if (restartTimer) {
        clearTimeout(restartTimer);
        restartTimer = null;
    }

    if (child) {
        child.kill("SIGTERM");

        setTimeout(() => {
            if (child) {
                child.kill("SIGKILL");
            }
            process.exit(0);
        }, 5000);
    } else {
        process.exit(0);
    }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

process.on("uncaughtException", (error) => {
    console.error("[INDEX] Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason) => {
    console.error("[INDEX] Unhandled Promise Rejection:", reason);
});

start();
