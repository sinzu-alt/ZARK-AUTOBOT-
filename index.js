const { spawn } = require("child_process");
const path = require("path");

const SCRIPT_FILE = "auto.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);

const RESTART_DELAY = 3000;

let child = null;
let restartTimer = null;
let shuttingDown = false;

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
        console.error(
            `[INDEX] Failed to start auto.js: ${error.message}`
        );

        scheduleRestart();
    });

    child.on("close", (exitCode, signal) => {
        child = null;

        if (shuttingDown) return;

        console.log(
            `[INDEX] auto.js stopped. Exit code: ${exitCode}, signal: ${signal || "none"}`
        );

        scheduleRestart();
    });
}

function scheduleRestart() {
    if (shuttingDown || restartTimer) return;

    console.log(
        `[INDEX] Restarting auto.js in ${RESTART_DELAY / 1000} seconds...`
    );

    restartTimer = setTimeout(() => {
        restartTimer = null;
        start();
    }, RESTART_DELAY);
}

function shutdown(signal) {
    if (shuttingDown) return;

    shuttingDown = true;

    console.log(
        `[INDEX] ${signal} received. Stopping...`
    );

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

process.on("SIGINT", () => {
    shutdown("SIGINT");
});

process.on("SIGTERM", () => {
    shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
    console.error(
        "[INDEX] Uncaught Exception:",
        error
    );
});

process.on("unhandledRejection", (reason) => {
    console.error(
        "[INDEX] Unhandled Promise Rejection:",
        reason
    );
});

start();
