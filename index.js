const { spawn } = require("child_process");
const path = require('path');

const SCRIPT_FILE = "auto.js";
const SCRIPT_PATH = path.join(__dirname, SCRIPT_FILE);

let restartCount = 0;
const MAX_RESTARTS = Infinity; // Walang katapusan
const DELAY_BEFORE_RESTART = 3000; // 3 segundo — mabilis pero hindi masyadong agaran

function start() {
  restartCount++;
  console.log(`\n🚀 [${new Date().toLocaleString("en-PH", { timeZone: "Asia/Manila" })}] PAGSISIMULA...`);
  console.log(`🔄 Pagkakataon: ${restartCount}`);

  const main = spawn("node", [SCRIPT_PATH], {
    cwd: __dirname,
    stdio: "inherit",
    shell: true,
    env: { 
      ...process.env,
      RESTART_COUNT: restartCount,
      AUTO_RELOGIN: "true"
    }
  });

  main.on("close", (exitCode) => {
    if (exitCode === 0) {
      console.log("✅ Tumigil nang tama — hindi magre-restart");
      restartCount = 0;
    } else {
      console.log(`\n🔴 NADISCONNECT / TUMIGIL — Code: ${exitCode}`);
      console.log(`⏳ Maghihintay ng ${DELAY_BEFORE_RESTART/1000}s...`);
      console.log("🔁 LALAPAG ULIT AGAD!\n");
      
      setTimeout(() => start(), DELAY_BEFORE_RESTART);
    }
  });

  main.on("error", (err) => {
    console.error("❌ Error sa proseso:", err.message);
    console.log(`⏳ Susubok ulit sa ${DELAY_BEFORE_RESTART/1000}s...`);
    setTimeout(() => start(), DELAY_BEFORE_RESTART);
  });
}

console.log("=".repeat(50));
console.log("🔥 SAIZEN — AUTO-RELOGIN ACTIVE");
console.log("✅ Pag nadisconnect → LALAPAG ULIT AGAD");
console.log("✅ Walang patayan — tuloy-tuloy");
console.log("=".repeat(50));

start();
