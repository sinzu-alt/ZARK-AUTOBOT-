const fs = require('fs');
const path = require('path');
const login = require('ws3-fca');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const script = path.join(__dirname, 'script');

// ⚙️ SETTINGS
const REPLY_DELAY = 5000;      // 5 segundo bago sumagot ulit
const SESSION_DIR = path.join(__dirname, './data/session');

// ✅ KANDADO — HINDI MAGREPLY HANGGANG BUSY
let isReplying = false;

// Siguraduhin may folder
if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
if (!fs.existsSync(SESSION_DIR)) fs.mkdirSync(SESSION_DIR, { recursive: true });

// Load config at dev
const config = fs.existsSync('./data/config.json') 
  ? JSON.parse(fs.readFileSync('./data/config.json', 'utf8')) 
  : [{ masterKey: { admin: [] }, fcaOption: { listenEvents: true, selfListen: true, online: true } }];
const dev = fs.existsSync('./dev.json') ? JSON.parse(fs.readFileSync('./dev.json')) : [];

const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map()
};

// Load lahat ng commands at events
function loadFile(p) {
  try {
    const mod = require(p);
    if (!mod.config) return;
    
    const names = Array.isArray(mod.config.name) ? mod.config.name : [mod.config.name];
    const entry = {
      name: mod.config.name,
      aliases: mod.config.aliases || [],
      hasPrefix: mod.config.hasPrefix !== false,
      run: mod.run,
      handleEvent: mod.handleEvent,
      cooldown: mod.config.cooldown || 3,
      role: mod.config.role || 0,
      dev: mod.config.dev || false
    };
    
    Utils.commands.set(names, entry);
    if (mod.handleEvent) Utils.handleEvent.set(names, entry);
  } catch (e) {
    console.error(`❌ ${path.basename(p)}: ${e.message}`);
  }
}

if (fs.existsSync(script)) {
  fs.readdirSync(script).forEach(file => {
    const full = path.join(script, file);
    if (fs.statSync(full).isDirectory()) {
      fs.readdirSync(full).forEach(sub => loadFile(path.join(full, sub)));
    } else {
      loadFile(full);
    }
  });
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

// ✅ LOGIN ENDPOINT
app.post('/login', async (req, res) => {
  const { state, commands, prefix, admin } = req.body;
  try {
    const uid = state.find(i => i.key === 'c_user')?.value;
    if (!uid) throw new Error('Invalid appstate');
    
    const sf = path.join(SESSION_DIR, `${uid}.json`);
    if (!fs.existsSync(sf)) fs.writeFileSync(sf, JSON.stringify(state, null, 2));
    
    // I-save sa history
    const histPath = './data/history.json';
    const history = fs.existsSync(histPath) ? JSON.parse(fs.readFileSync(histPath, 'utf-8')) : [];
    if (!history.find(h => h.userid === uid)) {
      history.push({ userid: uid, prefix, admin, enableCommands: commands || [] });
      fs.writeFileSync(histPath, JSON.stringify(history, null, 2));
    }
    
    await accountLogin(state, commands || [], prefix || '', admin || []);
    res.json({ success: true, message: '✅ NAKA-SAVE — Gagana na ang autoreply!' });
  } catch (e) {
    res.status(400).json({ error: true, message: e.message });
  }
});

app.listen(3000, () => console.log('🌐 Port 3000 — Online na!'));

// ─── MAIN LOGIN + AUTO-RECONNECT ───
async function accountLogin(state, enableCommands = [], prefix = '', admin = []) {
  return new Promise((resolve, reject) => {
    login({ appState: state }, async (err, api) => {
      if (err) {
        console.log(`🔴 Login failed: ${err.message}`);
        return reject(err);
      }
      
      const userid = await api.getCurrentUserID();
      console.log(`✅ ONLINE: ${userid}`);

      api.setOptions({
        listenEvents: true,
        selfListen: true,
        online: true,
        autoMarkDelivery: false,
        autoMarkRead: false
      });

      function listen() {
        api.listenMqtt(async (listenErr, event) => {
          // Auto-reconnect kapag nadisconnect
          if (listenErr) {
            console.log(`🔴 Nadisconnect — babalik sa 5s...`);
            setTimeout(() => {
              const sf = path.join(SESSION_DIR, `${userid}.json`);
              if (fs.existsSync(sf)) {
                const savedState = JSON.parse(fs.readFileSync(sf, 'utf-8'));
                accountLogin(savedState, enableCommands, prefix, admin);
              }
            }, 5000);
            return;
          }
          
          // ✅ Walang laman — laktawan
          if (!event || (!event.body && event.type === 'message')) return;
          
          // ✅ I-type ang event para makita kung ano ang dumarating
          if (event.body) {
            console.log(`📩 Dumating: ${event.body.slice(0, 30)}`);
          }

          // ✅ KANDADO — LALAKTAVAN KUNG BUSY
          if (isReplying) {
            console.log(`⏳ Busy pa — nilalaktawan`);
            return;
          }

          // ✅ PROSESO NG LAHAT NG EVENT (kabilang ang autoreply)
          isReplying = true; // 🔒 I-lock muna

          try {
            // Patakbuhin ang lahat ng handleEvent (autoreply, etc.)
            for (const [names, mod] of Utils.handleEvent) {
              if (mod.handleEvent) {
                try {
                  await mod.handleEvent({ api, event, enableCommands, prefix, admin });
                } catch (e) {
                  console.error(`❌ Event error [${mod.name}]: ${e.message}`);
                }
              }
            }

            // Patakbuhin ang commands
            if (event.body && event.type === 'message') {
              const body = event.body.trim();
              let cmdName = '';
              let args = [];
              let usesPrefix = true;

              // Alamin kung may prefix
              if (prefix && body.toLowerCase().startsWith(prefix.toLowerCase())) {
                const withoutPrefix = body.slice(prefix.length).trim();
                [cmdName, ...args] = withoutPrefix.split(/\s+/);
              } else {
                // Subukan kung prefixless command
                [cmdName, ...args] = body.split(/\s+/);
                usesPrefix = false;
              }

              if (cmdName) {
                cmdName = cmdName.toLowerCase();
                let found = null;
                
                for (const [names, mod] of Utils.commands) {
                  const allNames = [...names, ...(mod.aliases || [])].map(n => n?.toLowerCase());
                  if (allNames.includes(cmdName)) {
                    found = mod;
                    break;
                  }
                }

                if (found) {
                  // Kung kailangan ng prefix pero wala — huwag patakbuhin
                  if (usesPrefix && !found.hasPrefix) {
                    // Prefixless command — patakbuhin kahit walang prefix
                  } else if (!usesPrefix && found.hasPrefix) {
                    // May kailangang prefix — huwag patakbuhin kung wala
                    isReplying = false;
                    return;
                  }

                  console.log(`📤 Patakbuhin: ${found.name}`);
                  await found.run({ api, event, args, enableCommands, prefix, admin, Utils });
                }
              }
            }
          } catch (e) {
            console.error(`❌ Error: ${e.message}`);
          } finally {
            // ✅ 5 segundo bago magbukas ulit
            setTimeout(() => {
              isReplying = false; // 🔓 Buksan na ulit
              console.log(`🔓 Handa na ulit`);
            }, REPLY_DELAY);
          }
        });
      }
      
      listen();
      resolve();
    });
  });
}

// ✅ AUTO-LOAD SA PAG-START
(async () => {
  if (!fs.existsSync(SESSION_DIR)) return;
  const files = fs.readdirSync(SESSION_DIR);
  if (files.length === 0) {
    console.log(`⚠️ Mag-login muna sa dashboard`);
    return;
  }
  console.log(`🔍 Ina-load ${files.length} session...`);
  
  const histPath = './data/history.json';
  const history = fs.existsSync(histPath) ? JSON.parse(fs.readFileSync(histPath, 'utf-8')) : [];
  
  for (const file of files) {
    try {
      const uid = path.parse(file).name;
      const state = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, file), 'utf-8'));
      const data = history.find(h => h.userid === uid);
      if (data) {
        console.log(`🔁 Nagla-login: ${uid}`);
        await accountLogin(state, data.enableCommands || [], data.prefix || '', data.admin || []);
      }
    } catch (e) {
      console.log(`⚠️ ${file}: ${e.message}`);
    }
  }
})();
