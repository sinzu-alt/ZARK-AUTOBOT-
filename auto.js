const fs = require('fs');
const path = require('path');
const login = require('ws3-fca');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const script = path.join(__dirname, 'script');

// ⚙️ MGA SETTINGS — AYON SA GUSTO MO
const REPLY_DELAY = 5000;      // ⏱️ 5 segundo bago pwede sumagot ulit
const SESSION_DIR = path.join(__dirname, './data/session');

// ✅ KANDADO — HINDI MAGREPLY HANGGANG BUSY
let isReplying = false;

// Siguraduhin na may folder
if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

const config = fs.existsSync('./data/config.json') 
  ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8')) 
  : [{ masterKey: { admin: [] }, fcaOption: {} }];
const dev = JSON.parse(fs.readFileSync('./dev.json'));

const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map()
};

// Load lahat ng commands
function loadCmd(p) {
  try {
    const cmd = require(p);
    if (cmd.config) Utils.commands.set(cmd.config.name, cmd);
  } catch (e) { console.error(`❌ ${p}: ${e.message}`); }
}

fs.readdirSync(script).forEach((file) => {
  const fullPath = path.join(script, file);
  if (fs.statSync(fullPath).isDirectory()) {
    fs.readdirSync(fullPath).forEach(sub => loadCmd(path.join(fullPath, sub)));
  } else {
    loadCmd(fullPath);
  }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// Login endpoint
app.post('/login', async (req, res) => {
  const { state, commands, prefix, admin } = req.body;
  try {
    const uid = state.find(i => i.key === 'c_user')?.value;
    if (!uid) throw new Error('Invalid appstate');
    const sf = path.join(SESSION_DIR, `${uid}.json`);
    if (!fs.existsSync(sf)) fs.writeFileSync(sf, JSON.stringify(state, null, 2));
    await accountLogin(state, commands, prefix, [admin]);
    res.json({ success: true, message: '✅ NAKA-SAVE — Hindi na kailangan ulit!' });
  } catch (e) {
    res.status(400).json({ error: true, message: e.message });
  }
});

app.listen(3000, () => console.log('🌐 Port 3000 online'));

// ─── MAIN LOGIN + AUTO-RECONNECT ───
async function accountLogin(state, enableCommands = [], prefix, admin = []) {
  return new Promise((resolve, reject) => {
    login({ appState: state }, async (err, api) => {
      if (err) return reject(err);
      
      const userid = await api.getCurrentUserID();
      console.log(`✅ ONLINE: ${userid}`);

      api.setOptions({ listenEvents: true, selfListen: true });

      function listen() {
        api.listenMqtt(async (listenErr, event) => {
          // Auto-reconnect kapag nadisconnect
          if (listenErr) {
            console.log(`🔴 Nadisconnect — babalik sa 5s...`);
            setTimeout(() => {
              const sf = path.join(SESSION_DIR, `${userid}.json`);
              if (fs.existsSync(sf)) {
                accountLogin(JSON.parse(fs.readFileSync(sf, 'utf-8')), enableCommands, prefix, admin);
              }
            }, 5000);
            return;
          }
          if (!event || !event.body) return;
          
          // ✅ KANDADO — LALAKTAVAN KUNG BUSY
          if (isReplying) {
            console.log(`⏳ Busy pa — nilalaktawan: ${event.body.slice(0,20)}...`);
            return;
          }

          // ✅ PROSESO NG REPLY
          isReplying = true; // 🔒 I-lock muna

          try {
            const [cmdName, ...args] = event.body.trim().split(/\s+/);
            let found = null;
            for (const [names, cmd] of Utils.commands) {
              if (Array.isArray(names) ? names.includes(cmdName.toLowerCase()) : names === cmdName.toLowerCase()) {
                found = cmd;
                break;
              }
            }

            if (found) {
              console.log(`📤 Nagre-reply...`);
              await found.run({ api, event, args });
              console.log(`✅ Tapos na — maghihintay ng 5s`);
            }
          } catch (e) {
            console.error(`❌ Error: ${e.message}`);
          } finally {
            // ✅ 5 segundo bago magbukas ulit
            setTimeout(() => {
              isReplying = false; // 🔓 Buksan na ulit
              console.log(`🔓 Handang tumugon ulit`);
            }, REPLY_DELAY);
          }
        });
      }
      
      listen();
      resolve();
    });
  });
}

// ✅ AUTO-LOAD NG SESSION SA PAG-START
(async () => {
  if (!fs.existsSync(SESSION_DIR)) return;
  const files = fs.readdirSync(SESSION_DIR);
  if (files.length === 0) {
    console.log(`⚠️ Wala pang naka-save — mag-login muna sa dashboard`);
    return;
  }
  console.log(`🔍 Ina-load ang ${files.length} naka-save na session...`);
  for (const file of files) {
    try {
      const state = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, file), 'utf-8'));
      await accountLogin(state);
    } catch (e) {
      console.log(`⚠️ ${file}: ${e.message}`);
    }
  }
})();
