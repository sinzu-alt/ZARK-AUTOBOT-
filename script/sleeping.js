const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sleeping",
  version: "8.1.0",
  hasPermission: 0,
  credits: "you",
  description: "Sleeping / Asar Troller Mode",
  commandCategory: "fun",
  usages: "[on/off] or send . / .. / ...",
  cooldowns: 0,
  envConfig: {}
};

/*
 * ============================================================
 * OWNER / ADMIN CONFIGURATION
 * ============================================================
 */

const OWNER_IDS = [
  "61594251452411",
  "61594616562680"
];

/*
 * ============================================================
 * PERSISTENT STORAGE
 * ============================================================
 */

const DATA_FILE = path.join(__dirname, "sleeping_data.json");

function loadThreads() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return new Set();
    }

    const raw = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return new Set();
    }

    return new Set(data.map(String));
  } catch (err) {
    console.log(
      "[SLEEPING] Failed to load sleeping_data.json:",
      err.message
    );

    return new Set();
  }
}

function saveThreads(threads) {
  try {
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify([...threads], null, 2),
      "utf8"
    );
  } catch (err) {
    console.log(
      "[SLEEPING] Failed to save sleeping_data.json:",
      err.message
    );
  }
}

let sleepingThreads = loadThreads();

/*
 * ============================================================
 * TIMERS / TRACKERS
 * ============================================================
 */

const pendingTimers = new Map();
const lastReplyTime = new Map();
const messageTracker = new Map();
const lastReplyByThread = new Map();

/*
 * ============================================================
 * TIMER HELPERS
 * ============================================================
 */

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

  if (timers.size === 0) {
    pendingTimers.delete(threadID);
  }
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
 * ANTI-SPAM
 * ============================================================
 */

function isFlooding(threadID) {
  const now = Date.now();

  let tracker = messageTracker.get(threadID);

  if (!tracker || now > tracker.resetTime) {
    tracker = {
      count: 1,
      resetTime: now + 10000
    };

    messageTracker.set(threadID, tracker);
    return false;
  }

  tracker.count++;

  messageTracker.set(threadID, tracker);

  return tracker.count > 15;
}

/*
 * ============================================================
 * REPLIES
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
  "patingin nga ng utak, mukhang wala e",

  "parang kailangan mo muna ng loading screen",
  "ah ganun ba? ge seen lang natin yan",
  "mas may sense pa makipag-usap sa pader",
  "lakas ng confidence ah, saan nabibili yan?",
  "isang malaking wtf para sa sinabi mo",
  "pa-counseling ka muna, iba na yan",
  "daming ebas, wala namang ambag sa usapan",
  "subukan mo ulit, baka sakaling maging tama ka",
  "may discount ba sa katangahan ngayon?",
  "medyo cringe ka dyan sa part na yan ah",
  "yung pride mo paki-baba, baka matalisod ka",
  "sana ol pinapanindigan ang maling argumento",
  "parang sirang plaka, paulit-ulit na ebas",
  "isa pa, baka maging clown ka na tuluyan",
  "ge lang, ilabas mo lang yang sama ng loob mo",
  "paki-paliwanag ulit pero gamitin mo naman utak mo",
  "walang nakikinig pero sige, magsalita ka lang",
  "nakakatawa ka pala mag-chismis, paki-ulit",
  "ano raw? paki-translate sa wika ng may utak",
  "parang kailangan ng subtitles yung sinabi mo",
  "magkano ba load mo para mag-post ng ganitong kabobohan?",
  "ganda ng speech mo ah, kailan ang firing squad?",
  "noted. itatapon ko na sa basurahan yang sinabi mo",
  "lakas maka-keyboard warrior ah, galawin ang baso",
  "so feeling mo cool ka na niyan?",
  "baka kailangan mo na mag-update ng OS sa utak",
  "seryoso ka dyan o nagpapatawa ka lang?",
  "minsan mag-isip ka muna bago mag-type",
  "di ka ba napapagod maging ganyan?",
  "ge lang, suportahan ka sa delusion mo",

  "bro think he's the main character",
  "sorry, di ako nakikipag-usap sa NPC",
  "tuloy mo lang yan, ginagawa mo kaming masaya",
  "okay lang yan, kahit ikaw lang naniniwala sa sarili mo",
  "paki-mura ako sa chat para ramdam ko galit mo",
  "na-stress ako sa utak mo, parang brand new di nagagamit",
  "tayo na lang ba maiiwan dito sa kalokohan mo?",
  "virtual hug para sa nasaktan mong pride",
  "pa-explain naman nang dahan-dahan, mahina kasi memorya mo",
  "parang may sariling universe yung logic mo",
  "wait lang, hinahanap ko pa yung sense",
  "may point ka ba o paikot-ikot lang?",
  "sige lang, enjoy your moment",
  "interesting... hindi ko lang alam kung bakit",
  "okay noted, next contestant",
  "hindi ko alam kung seryoso ka o advanced comedian",
  "sige lang, baka may makaintindi rin sa'yo",
  "pakiulit, hindi umabot sa utak ko",
  "ang tapang mo sa keyboard ah",
  "kalmahan mo lang, hindi ka hinahabol",
  "may resibo ka ba o puro kwento?",
  "source: trust me bro?",
  "solid confidence, questionable information",
  "parang confident pero lost",
  "hindi ko alam kung matatawa ako o magtatanong",
  "may tutorial ba yan?",
  "sige lang, tuloy mo ang documentary",
  "very inspiring... in a strange way",
  "ang lakas ng plot twist ng sinabi mo",
  "wait, seryoso pala siya",
  "hindi kita pipigilan, entertainment din naman",
  "continue mo lang, invested na kami",
  "parang may sariling rules ang logic mo",
  "noted sa imaginary notebook",
  "may effort naman, kulang lang sa sense",
  "ang taas ng confidence, sana all",
  "di ko alam kung argument yan o freestyle",
  "puro setup, wala namang punchline",
  "nag-loading yung utak ko sa sinabi mo",
  "may point ka siguro, somewhere",
  "sige lang, hanapin natin together",
  "hindi lahat ng naiisip kailangang i-type",
  "delete draft muna",
  "pwede bang ulitin pero may sense version?",
  "parang kailangan ng director's cut yung explanation mo",
  "okay okay, narinig ka na namin",
  "ang haba pero short sa substance",
  "breathe in, breathe out",
  "hindi kita inaaway, kino-commentate lang kita",
  "wag kang kabahan, wala kaming expectations",
  "sige lang, career mo yan",
  "parang debate pero ikaw lang ang participant",
  "may audience ka na. congrats",
  "ang dramatic naman, may background music ba?",
  "may sequel pa ba yan?",
  "season 2 agad?",
  "plot armor activated",
  "ikaw na talaga",
  "di ko alam kung flex yan o warning",
  "lakas maka-final boss",
  "parang NPC dialogue pero premium edition",
  "update mo muna yung script",
  "mas mabilis pa loading ng wifi kaysa sa punto mo",
  "hindi ko na alam kung saan papunta tong usapan",
  "sige lang, nandito lang kami",
  "may resibo pero walang receipt",
  "interesting choice of words",
  "woke up and chose chaos",
  "activated na naman",
  "ang seryoso mo naman sa Tuesday",
  "wala bang chill mode?",
  "pwede bang low volume muna?",
  "okay, narinig ka hanggang kabilang GC",
  "parang may announcement pero walang event",
  "salamat sa TED Talk",
  "that's enough cinema for today",
  "take five muna",
  "sige lang, baka matapos din yan",
  "di ko alam kung impressed ako o confused",
  "confidently incorrect vibes",
  "may sariling rules ang universe mo",
  "unique take yan",
  "sige lang, stand by your statement",
  "hindi kita pipigilan, curious ako sa ending",
  "continue the saga",
  "this conversation needs subtitles",
  "parang kailangan natin ng translator",
  "slow down muna",
  "isang sentence lang sana",
  "nag-marathon ka ng typing ah",
  "keyboard warrior hours",
  "walang overtime dito",
  "sige lang, productive naman... somehow",
  "ang dami mong energy",
  "save some words for tomorrow",
  "okay enough internet for today",
  "tama na muna, baka maubusan ka ng keyboard",
  "ikaw ang bida",
  "we got it",
  "message received loud and clear",
  "copy that",
  "okay, noted",
  "interesting development",
  "unexpected plot",
  "another episode begins",
  "here we go again",
  "round two?",
  "may bonus round pa?",
  "never runs out of dialogue",
  "and the speech continues",
  "someone stop the microphone",
  "give the keyboard a break",
  "questionable recipe",
  "di ko alam kung luto na yan",
  "medyo sunog yung argumento",
  "hinaan mo yung apoy",
  "may smoke detector ba dito?",
  "okay, that's enough heat",
  "nagiging teleserye na to",
  "commercial break muna",
  "back to our regularly scheduled chaos",
  "sige lang, entertainment is entertainment",
  "walang bayad pero may show",
  "free trial ng katangahan",
  "premium confidence unlocked",
  "unlocked a new dialogue",
  "achievement unlocked: tuloy-tuloy na ebas",
  "achievement unlocked: no chill",
  "achievement unlocked: confident typing",
  "legendary na yung commitment",
  "okay, certified moment",
  "that was definitely a message",
  "message of the century",
  "historical yung confidence",
  "sige, archive natin yan",
  "for educational purposes only",
  "okay, moving on",
  "next!",
  "thank you for your contribution",
  "your message has been received",
  "processing... still processing...",
  "system needs a moment",
  "brain.exe has stopped responding",
  "loading response...",
  "error 404: point not found",
  "connection established, sense unavailable",
  "reboot and try again",
  "please update argument",
  "new patch available",
  "bug report received",
  "maintenance muna",
  "server is confused",
  "database cannot find the point",
  "searching for context...",
  "context not found",
  "logic package missing",
  "argument module unavailable",
  "system cannot process that level of ebas",
  "please try again later",
  "response pending...",
  "analysis complete: wala pa ring sense",
  "input received, common sense unavailable",
  "system detected excessive confidence",
  "warning: too much ebas detected",
  "processing nonsense...",
  "recalculating...",
  "still calculating...",
  "calculation failed",
  "logic connection unstable",
  "please reconnect to reality",
  "reality server unavailable",
  "common sense temporarily offline",
  "message saved under questionable decisions",
  "this message will be remembered unfortunately",
  "okay, that happened",
  "well... that was something",
  "interesting way to spend your time",
  "another day another ebas",
  "nothing to see here",
  "carry on",
  "continue at your own risk",
  "this is getting interesting",
  "what a development",
  "unexpected behavior detected",
  "maximum confidence reached",
  "zero chill detected",
  "drama level increasing",
  "argument level increasing",
  "sense level decreasing",
  "confidence level: maximum",
  "logic level: unavailable",
  "patience level: loading",
  "comedy level: accidental",
  "this conversation has entered another dimension",
  "okay, that escalated quickly",
  "and we're back",
  "another message successfully delivered",
  "nothing personal, just commentary",
  "carry on with the performance",
  "the show continues",
  "audience remains confused",
  "plot still developing",
  "waiting for the actual point",
  "still waiting...",
  "any moment now...",
  "maybe next message",
  "almost there... probably",
  "we'll pretend that made sense",
  "sure, why not",
  "alright then",
  "noted for absolutely no reason",
  "received and ignored mentally",
  "seen by the universe",
  "the universe has questions",
  "even the chat is confused",
  "chat needs a break",
  "keyboard needs therapy",
  "screen needs rest",
  "fingers need overtime pay",
  "that was a lot of words",
  "words were definitely used",
  "many words were involved",
  "sentence detected",
  "paragraph detected",
  "point still missing",
  "search continues",
  "investigation ongoing",
  "case remains unsolved",
  "mystery continues",
  "we may never know",
  "perhaps tomorrow",
  "maybe someday",
  "we'll get there eventually",
  "almost makes sense",
  "close enough",
  "good attempt",
  "interesting attempt",
  "creative interpretation",
  "unique argument",
  "unexpected strategy",
  "bold statement",
  "very bold",
  "extremely confident",
  "confidence noted",
  "logic not located",
  "sense not located",
  "context not located",
  "point not located",
  "still searching",
  "search complete",
  "result unavailable",
  "try another argument",
  "next message please",
  "moving forward",
  "let's pretend nothing happened",
  "okay, we're done here"
];

/*
 * ============================================================
 * RANDOM SUFFIXES
 * ============================================================
 *
 * Walang:
 * boss
 * bossing
 * king
 * chief
 * captain
 * idol
 * lods
 * bro
 * pre
 * pare
 * sir
 * master
 * bhie
 * ghorl
 */

const randomSuffixes = [

  "",
  "",
  "",
  "",
  " HAHAHA",
  " hahaha",
  " AHAHAHA",
  " HAHAHAHA",
  " 😂",
  " 🤣",
  " 😭",
  " 💀",
  " 🥱",
  " 🗿",
  " 🤡",
  " 🤓",
  " 👀",
  " 😭😭",
  " 💀💀",
  " 😂😂",
  " 🤣🤣",
  " 😭💀",
  " 💀😂",
  " 🤡💀",
  " 🗿💀",
  " 👀💀",
  " 🥱💀",
  "...",
  "...",
  "... haha",
  "... HAHAHA",
  "... 💀",
  "... 😭",
  "... 😂",
  "!",
  "!!",
  "!!!",
  "?!",
  "??",
  "?! 😂",
  " haha",
  " hehe",
  " lol",
  " lmao",
  " xdd",
  " pffft",
  " wao",
  " wow",
  " ayy",
  " ay wow",
  " AYY WOW",
  " grabe",
  " kalma",
  " relax",
  " chill",
  " sige",
  " sige lang",
  " noted",
  " okay",
  " sure ka?",
  " seryoso?",
  " talaga?",
  " weh?",
  " legit?",
  " totoo ba?",
  " sure?",
  " 😭🤣",
  " 🤣💀",
  " 🗿💀",
  " 🤡💀",
  " 👀💀",
  " 🥱💀",
  " 😭🥱",
  " 😂🤡",
  " 🤓💀",
  " HAHAHA 😭",
  " HAHAHA 💀",
  " HAHAHA 😂",
  " AHAHAHA 💀",
  " grabe 😭",
  " grabe 💀",
  " ay wow 😂",
  " ay wow 💀",
  " sige 😭",
  " sige 💀",
  " noted 😂",
  " noted 💀",
  " okay 😭",
  " okay 💀",
  " relax 😂",
  " relax 💀",
  " kalma 😭",
  " kalma 💀",
  " chill 😂",
  " chill 💀",
  " lmao 💀",
  " lol 😭",
  " xdd 💀",
  " pffft 😂",
  " wao 💀",
  " 👀",
  " 👀👀",
  " 💀😭",
  " 😭💀",
  " 😂💀",
  " 🤣😭",
  " 🗿😂",
  " 🤡😂",
  " 🤓😭",
  " 🥱😂"
];

/*
 * ============================================================
 * RANDOM REPLY GENERATOR
 * ============================================================
 */

function getRandomReply(threadID) {
  let reply;

  const lastReply =
    lastReplyByThread.get(threadID);

  do {

    const baseText =
      sleepingReplies[
        Math.floor(
          Math.random() *
          sleepingReplies.length
        )
      ];

    const suffix =
      randomSuffixes[
        Math.floor(
          Math.random() *
          randomSuffixes.length
        )
      ];

    reply = baseText + suffix;

  } while (
    reply === lastReply &&
    sleepingReplies.length > 1
  );

  lastReplyByThread.set(
    threadID,
    reply
  );

  /*
   * Occasional lowercase variation.
   */
  if (Math.random() < 0.08) {
    reply = reply.toLowerCase();
  }

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

    api.setMessageReaction(
      "🥷",
      messageID,
      () => {},
      true
    );

  } catch (err) {

    console.log(
      "[SLEEPING] Reaction error:",
      err.message
    );

  }
}

/*
 * ============================================================
 * COMMAND DETECTOR
 * ============================================================
 */

function isCommand(text) {

  const prefix =
    global.config?.PREFIX || "/";

  if (
    prefix &&
    text.startsWith(prefix)
  ) {
    return true;
  }

  if (text.startsWith("/")) return true;
  if (text.startsWith("!")) return true;
  if (text.startsWith("#")) return true;

  return false;
}

/*
 * ============================================================
 * ADMIN CHECK
 * ============================================================
 */

function isOwner(senderID) {
  return OWNER_IDS.includes(
    String(senderID)
  );
}

/*
 * ============================================================
 * TYPING INDICATOR
 * ============================================================
 */

function startTyping(api, threadID) {

  try {

    if (
      typeof api.sendTypingIndicator ===
      "function"
    ) {

      api.sendTypingIndicator(
        threadID
      );

    }

  } catch (err) {

    console.log(
      "[SLEEPING] Typing indicator error:",
      err.message
    );

  }
}

/*
 * ============================================================
 * COMMAND EXECUTION
 * ============================================================
 */

module.exports.run = async function ({
  api,
  event,
  args
}) {

  const {
    threadID,
    senderID,
    messageID
  } = event;

  /*
   * ADMIN ONLY
   */
  if (!isOwner(senderID)) {

    return api.sendMessage(
      "You do not have permission to use this command.",
      threadID,
      messageID
    );

  }

  const option =
    args[0]
      ? String(args[0]).toLowerCase()
      : "";

  /*
   * ==========================================================
   * ON
   * ==========================================================
   */

  if (
    option === "on" ||
    option === "."
  ) {

    sleepingThreads.add(
      String(threadID)
    );

    saveThreads(
      sleepingThreads
    );

    react(
      api,
      messageID
    );

    return api.sendMessage(
      "Sleeping mode ON 🥷",
      threadID,
      messageID
    );
  }

  /*
   * ==========================================================
   * OFF
   * ==========================================================
   */

  if (
    option === "off" ||
    option === ".."
  ) {

    sleepingThreads.delete(
      String(threadID)
    );

    saveThreads(
      sleepingThreads
    );

    cancelThreadTimers(
      threadID
    );

    react(
      api,
      messageID
    );

    return api.sendMessage(
      "Sleeping mode OFF 🔕",
      threadID,
      messageID
    );
  }

  /*
   * ==========================================================
   * HELP
   * ==========================================================
   */

  return api.sendMessage(
    "Gamitin:\n" +
    "/sleeping on\n" +
    "/sleeping off\n\n" +
    "Quick controls:\n" +
    ". = ON\n" +
    ".. = OFF\n" +
    "... = React only",
    threadID,
    messageID
  );
};

/*
 * ============================================================
 * EVENT LISTENER
 * ============================================================
 */

module.exports.handleEvent = function ({
  api,
  event
}) {

  const {
    threadID,
    senderID,
    body,
    messageID
  } = event;

  if (!body) return;

  /*
   * Ignore bot's own messages.
   */
  try {

    if (
      String(senderID) ===
      String(api.getCurrentUserID())
    ) {
      return;
    }

  } catch (_) {}

  const text =
    String(body).trim();

  /*
   * ==========================================================
   * .
   * ON
   * ==========================================================
   */

  if (text === ".") {

    if (!isOwner(senderID)) {
      return;
    }

    sleepingThreads.add(
      String(threadID)
    );

    saveThreads(
      sleepingThreads
    );

    react(
      api,
      messageID
    );

    return;
  }

  /*
   * ==========================================================
   * ..
   * OFF
   * ==========================================================
   */

  if (text === "..") {

    if (!isOwner(senderID)) {
      return;
    }

    sleepingThreads.delete(
      String(threadID)
    );

    saveThreads(
      sleepingThreads
    );

    cancelThreadTimers(
      threadID
    );

    react(
      api,
      messageID
    );

    return;
  }

  /*
   * ==========================================================
   * ...
   * REACTION ONLY
   * ==========================================================
   */

  if (text === "...") {

    if (!isOwner(senderID)) {
      return;
    }

    react(
      api,
      messageID
    );

    return;
  }

  /*
   * ==========================================================
   * CHECK IF ACTIVE
   * ==========================================================
   */

  if (
    !sleepingThreads.has(
      String(threadID)
    )
  ) {
    return;
  }

  /*
   * Don't respond to commands.
   */
  if (isCommand(text)) {
    return;
  }

  /*
   * ==========================================================
   * ANTI-SPAM
   * ==========================================================
   */

  if (
    isFlooding(threadID)
  ) {
    return;
  }

  /*
   * ==========================================================
   * 5 SECOND RESPONSE COOLDOWN
   * ==========================================================
   */

  const now =
    Date.now();

  const lastSent =
    lastReplyTime.get(
      threadID
    ) || 0;

  if (
    now - lastSent < 5000
  ) {
    return;
  }

  /*
   * Small random skip.
   */
  if (
    Math.random() < 0.04
  ) {
    return;
  }

  /*
   * ==========================================================
   * CREATE REPLY
   * ==========================================================
   */

  const reply =
    getRandomReply(
      threadID
    );

  /*
   * ==========================================================
   * TYPING
   * ==========================================================
   */

  startTyping(
    api,
    threadID
  );

  /*
   * ==========================================================
   * RANDOM DELAY
   * 4.2 - 7.5 SECONDS
   * ==========================================================
   */

  const randomDelay =
    Math.floor(
      Math.random() *
      (7500 - 4200 + 1)
    ) + 4200;

  let timer;

  timer = setTimeout(() => {

    removeTimer(
      threadID,
      timer
    );

    /*
     * If disabled while waiting,
     * don't send the reply.
     */
    if (
      !sleepingThreads.has(
        String(threadID)
      )
    ) {
      return;
    }

    try {

      /*
       * Reply directly to the
       * triggering message.
       */
      api.sendMessage(
        reply,
        threadID,
        messageID
      );

      lastReplyTime.set(
        threadID,
        Date.now()
      );

    } catch (err) {

      console.log(
        "[SLEEPING] Send error:",
        err.message
      );

    }

  }, randomDelay);

  addTimer(
    threadID,
    timer
  );
};

/*
 * ============================================================
 * OPTIONAL HANDLERS
 * ============================================================
 */

module.exports.handleReply = function () {};

module.exports.handleReaction = function () {};
