const fs = require("fs");
const path = require("path");
const login = require("ws3-fca");
const express = require("express");
const chalk = require("chalk");
const bodyParser = require("body-parser");
const cron = require("node-cron");

const app = express();

const script = path.join(__dirname, "script");
const DATA_DIR = path.join(__dirname, "data");
const SESSION_DIR = path.join(DATA_DIR, "session");
const HISTORY_FILE = path.join(DATA_DIR, "history.json");
const DATABASE_FILE = path.join(DATA_DIR, "database.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");

const Utils = {
  commands: new Map(),
  handleEvent: new Map(),
  account: new Map(),
  cooldowns: new Map(),
};

function ensureFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  fs.mkdirSync(path.join(script, "cache"), { recursive: true });

  if (!fs.existsSync(HISTORY_FILE))
    fs.writeFileSync(HISTORY_FILE, "[]", "utf8");

  if (!fs.existsSync(DATABASE_FILE))
    fs.writeFileSync(DATABASE_FILE, "[]", "utf8");

  if (!fs.existsSync(CONFIG_FILE))
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(createConfig(), null, 2));
}

function createConfig() {
  return [{
    masterKey: {
      admin: [],
      devMode: false,
      database: false,
      restartTime: 15
    },
    fcaOption: {
      forceLogin: true,
      listenEvents: true,
      logLevel: "silent",
      updatePresence: true,
      selfListen: true,
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      online: true,
      autoMarkDelivery: false,
      autoMarkRead: false
    }
  }];
}

ensureFiles();

let config;

try {
  config = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
} catch {
  config = createConfig();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

let dev = [];

try {
  dev = JSON.parse(fs.readFileSync("./dev.json", "utf8"));
} catch {
  dev = [];
}

/* =========================================================
   COMMAND LOADER
========================================================= */

function loadCommands() {
  if (!fs.existsSync(script)) return;

  for (const file of fs.readdirSync(script)) {
    const fullPath = path.join(script, file);

    try {
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        for (const child of fs.readdirSync(fullPath)) {
          loadCommandFile(path.join(fullPath, child));
        }
      } else {
        loadCommandFile(fullPath);
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Error loading ${file}: ${error.message}`
        )
      );
    }
  }
}

function loadCommandFile(filePath) {
  try {
    const moduleData = require(filePath);

    const {
      config: commandConfig,
      run,
      handleEvent
    } = moduleData;

    if (!commandConfig) return;

    const normalized = Object.fromEntries(
      Object.entries(commandConfig).map(([key, value]) => [
        key.toLowerCase(),
        value
      ])
    );

    const name = normalized.name || path.basename(filePath, ".js");
    const role = normalized.role ?? normalized.haspermission ?? 0;
    const version = normalized.version || "1.0.0";
    const hasPrefix =
      normalized.hasprefix !== undefined
        ? normalized.hasprefix
        : true;

    const aliases = Array.isArray(normalized.aliases)
      ? [...normalized.aliases]
      : [];

    if (!aliases.includes(name))
      aliases.push(name);

    const command = {
      name,
      role,
      run,
      aliases: aliases.map(x => String(x).toLowerCase()),
      description: normalized.description || "",
      usage: normalized.usage || "",
      version,
      hasPrefix,
      credits: normalized.credits || "",
      cooldown: Number(normalized.cooldown ?? 5),
      dev: normalized.dev || false
    };

    if (run) {
      Utils.commands.set(command.name, command);
    }

    if (handleEvent) {
      Utils.handleEvent.set(command.name, {
        ...command,
        handleEvent
      });
    }

  } catch (error) {
    console.error(
      chalk.red(
        `Error installing command ${filePath}: ${error.message}`
      )
    );
  }
}

loadCommands();

/* =========================================================
   HELPERS
========================================================= */

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(
    file,
    JSON.stringify(data, null, 2),
    "utf8"
  );
}

function getHistory() {
  return readJSON(HISTORY_FILE, []);
}

function saveHistory(history) {
  writeJSON(HISTORY_FILE, history);
}

function getSessionFile(userid) {
  return path.join(
    SESSION_DIR,
    `${userid}.json`
  );
}

function findCommand(command) {
  if (!command) return null;

  command = command.toLowerCase();

  for (const cmd of Utils.commands.values()) {
    if (cmd.aliases.includes(command)) {
      return cmd;
    }
  }

  for (const cmd of Utils.handleEvent.values()) {
    if (cmd.aliases.includes(command)) {
      return cmd;
    }
  }

  return null;
}

/* =========================================================
   SESSION STORAGE
========================================================= */

/*
  IMPORTANT:

  Disconnect:
      KEEP SESSION

  Server restart:
      USE SAVED SESSION

  Invalid / expired / locked session:
      REMOVE SESSION

  Manual removal:
      REMOVE SESSION
*/

function saveSession(userid, state) {
  const sessionFile = getSessionFile(userid);

  if (fs.existsSync(sessionFile)) {
    console.log(
      chalk.gray(
        `[SESSION] Existing session preserved for ${userid}`
      )
    );
    return false;
  }

  fs.writeFileSync(
    sessionFile,
    JSON.stringify(state, null, 2),
    "utf8"
  );

  console.log(
    chalk.green(
      `[SESSION] Saved permanent session for ${userid}`
    )
  );

  return true;
}

function removeSession(userid) {
  const sessionFile = getSessionFile(userid);

  if (!fs.existsSync(sessionFile))
    return;

  try {
    fs.unlinkSync(sessionFile);

    console.log(
      chalk.yellow(
        `[SESSION] Removed invalid session for ${userid}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        `[SESSION] Failed removing ${userid}: ${error.message}`
      )
    );
  }
}

/* =========================================================
   USER LIST
========================================================= */

function addUserHistory(
  userid,
  state,
  prefix,
  admin
) {
  const history = getHistory();

  const existing = history.find(
    user => user.userid === userid
  );

  if (existing) {
    existing.prefix = prefix || existing.prefix || "";
    existing.admin = admin || existing.admin || [];
    existing.sessionSaved = true;

    saveHistory(history);
    return;
  }

  history.push({
    userid,
    prefix: prefix || "",
    admin: admin || [],
    blacklist: [],
    enableCommands: true,
    time: 0,
    sessionSaved: true,
    createdAt: Date.now()
  });

  saveHistory(history);
}

/*
  Removes account from active/history list only.

  SESSION FILE IS NOT TOUCHED.
*/
function removeUserFromList(userid) {
  const history = getHistory();

  const filtered = history.filter(
    user => user.userid !== userid
  );

  saveHistory(filtered);

  Utils.account.delete(userid);

  console.log(
    chalk.yellow(
      `[USER] Removed ${userid} from active list. Session preserved.`
    )
  );
}

/*
  Only use this for an actually invalid/expired/locked
  account or explicit manual deletion.
*/
function removeUserCompletely(userid) {
  removeUserFromList(userid);
  removeSession(userid);
}

/* =========================================================
   LOGIN
========================================================= */

async function accountLogin(
  state,
  prefix = "/",
  admin = [],
  options = {}
) {
  return new Promise((resolve, reject) => {

    login(
      {
        appState: state
      },

      async (error, api) => {

        if (error) {

          console.error(
            chalk.red(
              `[LOGIN] ${error.message || error}`
            )
          );

          /*
            DO NOT DELETE SESSION HERE.

            A temporary connection/login error must not
            destroy the permanent saved session.
          */

          reject(error);
          return;
        }

        let userid;

        try {
          userid = await api.getCurrentUserID();
        } catch (error) {
          reject(error);
          return;
        }

        if (!userid) {
          reject(
            new Error("Unable to determine account ID.")
          );
          return;
        }

        console.log(
          chalk.green(
            `[LOGIN] Connected account ${userid}`
          )
        );

        try {
          const info = await api.getUserInfo(userid);

          if (
            !info ||
            !info[userid] ||
            !info[userid].name
          ) {
            throw new Error(
              "Account session appears invalid, expired, or locked."
            );
          }

          const userInfo = info[userid];

          let history = getHistory();

          const previous = history.find(
            user => user.userid === userid
          );

          Utils.account.set(userid, {
            name: userInfo.name,
            profileUrl: userInfo.profileUrl || "",
            thumbSrc: userInfo.thumbSrc || "",
            time: previous?.time || 0
          });

          addUserHistory(
            userid,
            state,
            prefix,
            admin
          );

          /*
            IMPORTANT:
            Save only when no session exists.

            Existing session is preserved.
          */
          saveSession(userid, state);

        } catch (accountError) {

          /*
            This is different from a normal disconnect.

            If FCA successfully connects but the account
            cannot be identified anymore, the saved session
            is treated as invalid.
          */

          if (
            /invalid|expired|locked|suspended/i.test(
              accountError.message || ""
            )
          ) {
            removeUserFromList(userid);
            removeSession(userid);
          }

          reject(accountError);
          return;
        }

        api.setOptions({
          listenEvents:
            config[0].fcaOption.listenEvents,

          logLevel:
            config[0].fcaOption.logLevel,

          updatePresence:
            config[0].fcaOption.updatePresence,

          selfListen:
            config[0].fcaOption.selfListen,

          forceLogin:
            config[0].fcaOption.forceLogin,

          online:
            config[0].fcaOption.online,

          autoMarkDelivery:
            config[0].fcaOption.autoMarkDelivery,

          autoMarkRead:
            config[0].fcaOption.autoMarkRead
        });

        let intervalId = setInterval(() => {

          const account =
            Utils.account.get(userid);

          if (!account) {
            clearInterval(intervalId);
            return;
          }

          Utils.account.set(userid, {
            ...account,
            time: account.time + 1
          });

        }, 1000);

        let listener;

        try {

          listener = api.listenMqtt(
            async (listenError, event) => {

              /*
                TEMPORARY DISCONNECT

                Never delete the session here.
              */

              if (listenError) {

                console.error(
                  chalk.yellow(
                    `[CONNECTION] ${userid}: ${
                      listenError.message ||
                      listenError
                    }`
                  )
                );

                /*
                  Account remains in memory/history.
                  Saved session remains on disk.
                */

                return;
              }

              if (!event) return;

              try {
                await handleEvent(
                  api,
                  event,
                  userid,
                  prefix,
                  admin
                );
              } catch (error) {
                console.error(
                  chalk.red(
                    `[EVENT] ${error.message}`
                  )
                );
              }
            }
          );

        } catch (error) {

          /*
            Listener crash != invalid session.

            Keep session.
          */

          console.error(
            chalk.red(
              `[LISTENER] ${error.message}`
            )
          );
        }

        resolve({
          api,
          userid,
          listener
        });
      }
    );
  });
}

/* =========================================================
   EVENT HANDLER
========================================================= */

async function handleEvent(
  api,
  event,
  userid,
  prefix,
  admin
) {
  if (!event) return;

  const body =
    typeof event.body === "string"
      ? event.body.trim()
      : "";

  const history = getHistory();

  const userData =
    history.find(
      user => user.userid === userid
    ) || {};

  const blacklist =
    Array.isArray(userData.blacklist)
      ? userData.blacklist
      : [];

  if (
    event.senderID &&
    blacklist.includes(event.senderID)
  ) {
    if (body.startsWith(prefix)) {
      api.sendMessage(
        "We're sorry, but you have been banned from using the bot.",
        event.threadID,
        event.messageID
      );
    }

    return;
  }

  let commandName = "";
  let args = [];

  if (body.startsWith(prefix)) {

    const commandText =
      body
        .slice(prefix.length)
        .trim();

    if (!commandText) {
      api.sendMessage(
        `Invalid command. Use ${prefix}help to see available commands.`,
        event.threadID,
        event.messageID
      );
      return;
    }

    const parts =
      commandText.split(/\s+/);

    commandName =
      parts.shift().toLowerCase();

    args = parts;
  }

  const command =
    findCommand(commandName);

  /*
    Handle event commands.
  */

  for (const cmd of Utils.handleEvent.values()) {

    if (
      typeof cmd.handleEvent === "function"
    ) {
      try {
        await cmd.handleEvent({
          api,
          event,
          enableCommands: true,
          admin,
          prefix,
          blacklist,
          Utils
        });
      } catch (error) {
        console.error(
          chalk.red(
            `[${cmd.name}] ${error.message}`
          )
        );
      }
    }
  }

  if (!command) {

    if (
      body.startsWith(prefix) &&
      commandName
    ) {
      api.sendMessage(
        `Invalid command '${commandName}'. Use ${prefix}help to see the list of available commands.`,
        event.threadID,
        event.messageID
      );
    }

    return;
  }

  /*
    Permission
  */

  const globalAdmin =
    config?.[0]?.masterKey?.admin || [];

  const isGlobalAdmin =
    globalAdmin.includes(event.senderID) ||
    admin.includes(event.senderID);

  let isThreadAdmin = isGlobalAdmin;

  if (
    event.threadID
  ) {
    try {

      const database =
        readJSON(
          DATABASE_FILE,
          []
        );

      const thread =
        database.find(
          item =>
            item &&
            Object.prototype.hasOwnProperty.call(
              item,
              event.threadID
            )
        );

      if (
        thread &&
        Array.isArray(
          thread[event.threadID]
        ) &&
        thread[event.threadID].some(
          x => x.id === event.senderID
        )
      ) {
        isThreadAdmin = true;
      }

    } catch {}
  }

  if (
    command.dev &&
    !dev.includes(event.senderID)
  ) {
    return api.sendMessage(
      "You don't have access to this command.",
      event.threadID,
      event.messageID
    );
  }

  const role =
    Number(command.role || 0);

  if (
    (role === 1 && !isGlobalAdmin) ||
    (role === 2 && !isThreadAdmin) ||
    (
      role === 3 &&
      !globalAdmin.includes(event.senderID)
    )
  ) {
    return api.sendMessage(
      "You don't have permission to use this command.",
      event.threadID,
      event.messageID
    );
  }

  /*
    Cooldown
  */

  const cooldown =
    Number(command.cooldown || 0);

  if (cooldown > 0) {

    const key =
      `${event.senderID}_${command.name}_${userid}`;

    const previous =
      Utils.cooldowns.get(key);

    const now = Date.now();

    if (
      previous &&
      now - previous <
        cooldown * 1000
    ) {

      const remaining =
        Math.ceil(
          (
            previous +
            cooldown * 1000 -
            now
          ) / 1000
        );

      return api.sendMessage(
        `Please wait ${remaining} seconds before using the "${command.name}" command again.`,
        event.threadID,
        event.messageID
      );
    }

    Utils.cooldowns.set(
      key,
      now
    );
  }

  /*
    Execute command.
  */

  if (
    typeof command.run === "function"
  ) {

    await command.run({
      api,
      event,
      args,
      enableCommands: true,
      admin,
      prefix,
      blacklist,
      Utils
    });
  }
}

/* =========================================================
   DASHBOARD
========================================================= */

app.use(
  express.static(
    path.join(__dirname, "public")
  )
);

app.use(bodyParser.json());
app.use(express.json());

const routes = [
  {
    path: "/",
    file: "index.html"
  },
  {
    path: "/step_by_step_guide",
    file: "guide.html"
  },
  {
    path: "/online_user",
    file: "online.html"
  }
];

for (const route of routes) {

  app.get(
    route.path,
    (req, res) => {

      res.sendFile(
        path.join(
          __dirname,
          "public",
          route.file
        )
      );
    }
  );
}

/* =========================================================
   INFO
========================================================= */

app.get("/info", (req, res) => {

  const data =
    Array.from(
      Utils.account.entries()
    ).map(
      ([userid, account]) => ({
        userid,
        name: account.name,
        profileUrl: account.profileUrl,
        thumbSrc: account.thumbSrc,
        time: account.time
      })
    );

  res.json(data);
});

/* =========================================================
   COMMANDS
========================================================= */

app.get("/commands", (req, res) => {

  const commands =
    Array.from(
      Utils.commands.values()
    ).map(cmd => ({
      name: cmd.name,
      aliases: cmd.aliases,
      role: cmd.role,
      description: cmd.description,
      usage: cmd.usage,
      version: cmd.version,
      credits: cmd.credits
    }));

  res.json(commands);
});

/* =========================================================
   LOGIN DASHBOARD
========================================================= */

app.post("/login", async (req, res) => {

  const {
    state,
    prefix,
    admin
  } = req.body;

  try {

    if (
      !Array.isArray(state) ||
      !state.length
    ) {
      return res.status(400).json({
        error: true,
        message: "Missing app state data."
      });
    }

    const cUser =
      state.find(
        item => item.key === "c_user"
      );

    if (!cUser?.value) {
      return res.status(400).json({
        error: true,
        message:
          "Invalid appstate: c_user was not found."
      });
    }

    const userid =
      String(cUser.value);

    /*
      Already connected:
      don't create another session.
    */

    if (
      Utils.account.has(userid)
    ) {
      return res.status(200).json({
        success: true,
        message:
          "Account is already connected.",
        userid
      });
    }

    /*
      If session already exists,
      use it instead of creating another file.
    */

    const sessionFile =
      getSessionFile(userid);

    if (
      fs.existsSync(sessionFile)
    ) {

      console.log(
        chalk.cyan(
          `[LOGIN] Existing saved session found for ${userid}.`
        )
      );

      try {

        const savedState =
          JSON.parse(
            fs.readFileSync(
              sessionFile,
              "utf8"
            )
          );

        await accountLogin(
          savedState,
          prefix || "/",
          admin || []
        );

        return res.status(200).json({
          success: true,
          message:
            "Existing saved session restored.",
          userid
        });

      } catch (error) {

        /*
          Existing session failed.

          Only now do we allow the user to
          submit a new session.
        */

        console.log(
          chalk.yellow(
            `[LOGIN] Saved session could not be restored for ${userid}.`
          )
        );
      }
    }

    /*
      First login.
    */

    await accountLogin(
      state,
      prefix || "/",
      admin || []
    );

    return res.status(200).json({
      success: true,
      message:
        "Login successful. Session saved permanently.",
      userid
    });

  } catch (error) {

    console.error(
      chalk.red(
        `[LOGIN] ${error.message || error}`
      )
    );

    return res.status(400).json({
      error: true,
      message:
        error.message ||
        "Login failed."
    });
  }
});

/* =========================================================
   MANUAL SESSION DELETE
========================================================= */

app.post("/logout", (req, res) => {

  const { userid } = req.body;

  if (!userid) {
    return res.status(400).json({
      error: true,
      message: "Missing userid."
    });
  }

  /*
    Manual logout = remove account AND session.
  */

  removeUserFromList(userid);
  removeSession(userid);

  return res.json({
    success: true,
    message:
      "Account removed and saved session deleted."
  });
});

/* =========================================================
   SERVER
========================================================= */

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    chalk.green(
      `Server running on port ${PORT}`
    )
  );

});

/* =========================================================
   STARTUP SESSION RESTORE
========================================================= */

async function restoreSavedSessions() {

  console.log(
    chalk.cyan(
      "[SESSION] Checking saved sessions..."
    )
  );

  const files =
    fs.readdirSync(
      SESSION_DIR
    );

  if (!files.length) {

    console.log(
      chalk.gray(
        "[SESSION] No saved sessions found."
      )
    );

    return;
  }

  for (const file of files) {

    if (
      !file.endsWith(".json")
    ) continue;

    const userid =
      path.basename(
        file,
        ".json"
      );

    const sessionFile =
      path.join(
        SESSION_DIR,
        file
      );

    try {

      const state =
        JSON.parse(
          fs.readFileSync(
            sessionFile,
            "utf8"
          )
        );

      const history =
        getHistory();

      const saved =
        history.find(
          user =>
            String(user.userid) ===
            String(userid)
        );

      const prefix =
        saved?.prefix || "/";

      const admin =
        saved?.admin || [];

      console.log(
        chalk.cyan(
          `[SESSION] Restoring ${userid}...`
        )
      );

      await accountLogin(
        state,
        prefix,
        admin,
        {
          startup: true
        }
      );

      console.log(
        chalk.green(
          `[SESSION] Restored ${userid}`
        )
      );

    } catch (error) {

      /*
        IMPORTANT:
        Do NOT automatically delete the session
        merely because startup reconnect failed.

        Temporary network/FCA errors can happen.

        The saved session remains available for
        the next restart/reconnect.
      */

      console.error(
        chalk.yellow(
          `[SESSION] Could not restore ${userid}: ${
            error.message || error
          }`
        )
      );

      Utils.account.delete(userid);
    }
  }
}

/* =========================================================
   PERIODIC HISTORY SAVE + RESTART
========================================================= */

async function saveRuntimeData() {

  const history =
    getHistory();

  for (const user of history) {

    const account =
      Utils.account.get(
        user.userid
      );

    if (account) {
      user.time =
        account.time;
    }
  }

  saveHistory(history);
}

/*
  Save runtime information before restart.

  The session directory is NEVER cleared here.
*/

const restartTime =
  Number(
    config?.[0]?.masterKey?.restartTime
  ) || 15;

cron.schedule(
  `*/${restartTime} * * * *`,
  async () => {

    try {

      await saveRuntimeData();

      console.log(
        chalk.yellow(
          "[SYSTEM] Runtime data saved. Restarting..."
        )
      );

      /*
        IMPORTANT:
        Do NOT delete:
          data/session/*.json
      */

      process.exit(0);

    } catch (error) {

      console.error(
        chalk.red(
          `[SYSTEM] Save error: ${error.message}`
        )
      );
    }
  }
);

/* =========================================================
   PROCESS SAFETY
========================================================= */

process.on(
  "unhandledRejection",
  reason => {

    console.error(
      chalk.red(
        "Unhandled Promise Rejection:"
      ),
      reason
    );

  }
);

process.on(
  "uncaughtException",
  error => {

    console.error(
      chalk.red(
        "Uncaught Exception:"
      ),
      error
    );

  }
);

/*
  Graceful shutdown.

  Save history but NEVER delete sessions.
*/

async function shutdown(signal) {

  console.log(
    chalk.yellow(
      `[SYSTEM] ${signal} received. Saving data...`
    )
  );

  try {
    await saveRuntimeData();
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

process.on(
  "SIGTERM",
  () => shutdown("SIGTERM")
);

process.on(
  "SIGINT",
  () => shutdown("SIGINT")
);

/* =========================================================
   START
========================================================= */

(async () => {

  console.log(
    chalk.cyan(
      "========================================"
    )
  );

  console.log(
    chalk.cyan(
      "      PERSISTENT SESSION SYSTEM"
    )
  );

  console.log(
    chalk.cyan(
      "========================================"
    )
  );

  await restoreSavedSessions();

})();
