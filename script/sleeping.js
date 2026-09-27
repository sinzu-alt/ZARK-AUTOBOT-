const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sleeping",
  version: "6.3.0",
  hasPermission: 0,
  credits: "you",
  description: "Undetectable Pure Asar Troller Mode - No 'pre' allowed.",
  commandCategory: "fun",
  usages: ". / .. / ...",
  cooldowns: 0
};

/*
 * ============================================================
 * OWNER
 * ============================================================
 * PALITAN ITO NG FACEBOOK UID MO.
 */
const OWNER_ID = "YOUR_OWNER_ID";

/*
 * ============================================================
 * PERSISTENT STORAGE
 * ============================================================
 */

const DATA_FILE = path.join(__dirname, "sleeping_data.json");

function loadThreads() {
  try {
    if (!fs.existsSync(DATA_FILE)) return new Set();
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return new Set();
    return new Set(data.map(String));
  } catch (err) {
    console.log("[SLEEPING] Failed to load sleeping_data.json:", err.message);
    return new Set();
  }
}

function saveThreads(threads) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify([...threads], null, 2), "utf8");
  } catch (err) {
    console.log("[SLEEPING] Failed to save sleeping_data.json:", err.message);
  }
}

let sleepingThreads = loadThreads();

/*
 * ============================================================
 * PENDING TIMERS
 * ============================================================
 */

const pendingTimers = new Map();

function addTimer(threadID, timer) {
  if (!pendingTimers.has(threadID)) {
    pendingTimers.set(threadID, new Set());
  }
  pendingTimers.get(threadID).add(timer);
}

function removeTimer(threadID, timer) {
  const timers = pendingTimers.get(threadID);
  if (!timers) return;
  timers.delete(timer);
  if (timers.size === 0) pendingTimers.delete(threadID);
}

function cancelThreadTimers(threadID) {
  const timers = pendingTimers.get(threadID);
  if (!timers) return;
  for (const timer of timers) {
    clearTimeout(timer);
  }
  pendingTimers.delete(threadID);
}

/*
 * ============================================================
 * UNDETECTABLE PANG-ASAR REPLIES (WALANG "PRE" / "LODS")
 * ============================================================
 */

const sleepingReplies = [
  "iyak muna bago magsalita",
  "kwento mo sa pagong",
  "sige lang, wala namang nagtanong",
  "galit na galit gustong manakit HAHAHA",
  "medyo walang kwenta sinabi mo",
  "weh di nga? seryoso ka dyan?",
  "masyado kang seryoso, baka pumutok ugat mo",
  "ge lang, type ka lang dyan. nakikinig ako kunwari",
  "inom ka muna tubig, baka ma-stroke ka na sa galit",
  "lakas ng hangin ah, saan bagyo?",
  "flex mo lang yan, kahit walang may pake",
  "tulog mo na yan, halatang kulang ka sa aruga",
  "dami mong sinasabi, mukha ka namang ewan",
  "sakit nun ah... chour",
  "parang may nagsasalita... hangin lang pala",
  "pang-mainstage drama mo, aminin mo",
  "oks lang yan, maute ka pa naman mag-isip",
  "sino nagtanong? ah wala pala",
  "pa-autograph naman, lakas mo magmarunong e",
  "tuloy mo lang yan, huwag kang mahihiya sa sarili mo",
  "puro ka salita, wala namang maipagmamayabang",
  "isang malaking SANA ALL na lang sa kabobohan mo",
  "noted with thanks, kahit paboritong hangin ka lang",
  "gamitin din ang utak minsan, hindi pang-display lang",
  "dami mong sinabi, diko pa rin binasa",
  "basta ako spectator lang sa katangahan mo",
  "sigaw mo pa nang mas malakas, wala gihapon nakakarinig",
  "tahan na, huwag ka nang umiyak",
  "next topic, nabuburyong na 'ko sa mukha mo",
  "baka gusto mo muna magpa-palamig ng ulo",
  "luh nagagalit na siya oh, nakakatakot naman",
  "sige lang, bida ka naman sa sarili mong mundo",
  "sarap mo kausap, parang semento",
  "may tao pala rito? akala ko bakante lang",
  "ok sabi mo e, di naman kami papatol sa 'yo",
  "ang lakas mo mag-talk, sarap mong pitikin",
  "clap clap clap para sa feeling magaling",
  "may amoy ba sinasabi mo o sadyang ganyan ka lang?",
  "magkano sweldo mo sa pagiging feelingero?",
  "isa pa nga, tignan natin hanggang saan kakayanin mo",
  "sige lang, taob kami sa'yo e",
  "solid din ng kalokohan mo, patingin ka na",
  "paki-chat kapag may katuturan na punto mo",
  "minsan lang 'to pero mukha kang joke",
  "main character ka ghorl?",
  "sige habaan mo pa script mo",
  "asan na yung part na dapat kaming matakot?",
  "so ano gusto mo gawin namin, ipag-misa ka?",
  "chill ka lang, wala namang nagmamahal sa'yo dyan",
  "ano uulitin mo pa? sige lang",
  "puro ka dada, wala ka namang maipakita",
  "galit ka na niyan? haha subukan mo pa",
  "ksp ka rin nuh?",
  "patingin nga ng utak, mukhang wala e"
];

// Anti-Spam Detector Suffixes (Dynamic Humanizer)
const randomSuffixes = [
  "", " HAHAHA", " 😂", " 🤣", " 😭", " 💀", " 🫣", " 🥱", 
  "...", "!", "!!", " ah", " haha", " wao", " 👀"
];

const lastReplyByThread = new Map();

function getRandomReply(threadID) {
  let reply;
  const lastReply = lastReplyByThread.get(threadID);

  do {
    const baseText = sleepingReplies[Math.floor(Math.random() * sleepingReplies.length)];
    const suffix = randomSuffixes[Math.floor(Math.random() * randomSuffixes.length)];
    reply = baseText + suffix;
  } while (
    reply === lastReply &&
    sleepingReplies.length > 1
  );

  lastReplyByThread.set(threadID, reply);
  return reply;
}

/*
 * ============================================================
 * REACTION
 * ============================================================
 */

function react(api, messageID) {
  if (!messageID) return;
  try {
    api.setMessageReaction("🥷", messageID, () => {}, true);
  } catch (err) {
    console.log("[SLEEPING] Reaction error:", err.message);
  }
}

/*
 * ============================================================
 * COMMAND DETECTOR
 * ============================================================
 */

function isCommand(text) {
  const prefix = global.config?.PREFIX || "/";
  if (prefix && text.startsWith(prefix)) return true;
  if (text.startsWith("/")) return true;
  if (text.startsWith("!")) return true;
  if (text.startsWith("#")) return true;
  return false;
}

/*
 * ============================================================
 * OWNER CHECK
 * ============================================================
 */

function isOwner(senderID) {
  return String(senderID) === String(OWNER_ID);
}

/*
 * ============================================================
 * SEND TYPING
 * ============================================================
 */

function startTyping(api, threadID) {
  try {
    if (typeof api.sendTypingIndicator === "function") {
      api.sendTypingIndicator(threadID);
    }
  } catch (err) {
    console.log("[SLEEPING] Typing indicator error:", err.message);
  }
}

/*
 * ============================================================
 * EVENT HANDLER
 * ============================================================
 */

module.exports.handleEvent = function ({ api, event }) {
  const { threadID, senderID, body, messageID } = event;

  if (!body) return;
  if (String(senderID) === String(api.getCurrentUserID())) return;

  const text = String(body).trim();

  // ON (.)
  if (text === ".") {
    if (!isOwner(senderID)) return;
    sleepingThreads.add(String(threadID));
    saveThreads(sleepingThreads);
    react(api, messageID);
    return;
  }

  // OFF (..)
  if (text === "..") {
    if (!isOwner(senderID)) return;
    sleepingThreads.delete(String(threadID));
    saveThreads(sleepingThreads);
    cancelThreadTimers(threadID);
    react(api, messageID);
    return;
  }

  // STATUS (...)
  if (text === "...") {
    if (!isOwner(senderID)) return;
    react(api, messageID);
    return;
  }

  if (!sleepingThreads.has(String(threadID))) return;
  if (isCommand(text)) return;

  const reply = getRandomReply(threadID);

  startTyping(api, threadID);

  /*
   * ANTI-DETECTION RANDOM TIMEOUT
   * Dynamic delay 4.2s - 7.2s para hindi hulihin ng Messenger Security
   */
  const randomDelay = Math.floor(Math.random() * (7200 - 4200 + 1)) + 4200;

  const timer = setTimeout(() => {
    removeTimer(threadID, timer);

    if (!sleepingThreads.has(String(threadID))) return;

    try {
      api.sendMessage(reply, threadID, messageID);
    } catch (err) {
      console.log("[SLEEPING] Send error:", err.message);
    }
  }, randomDelay);

  addTimer(threadID, timer);
};
