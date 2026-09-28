const fs = require("fs");
const path = require("path");

module.exports.config = {
  name: "sleeping",
  version: "8.8.0",
  hasPermission: 0,
  credits: "you",
  description: "Sleeping / 4.2s to 6s Interval Pure Language Asar Troller",
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
 * PURE TAGALOG ASAR REPLIES (HARD HITTING)
 * ============================================================
 */

const tagalogReplies = [
  "iyak muna nang mahina bago ka mag-type",
  "galit na galit gustong manakit kaso lampas pa rin sa punto",
  "pumutok na ugat mo sa leeg kalma lang pikon",
  "itutulog mo na lang yan halatang kulang ka sa aruga",
  "iiyak na yan iiyak na yan",
  "sige lang pumatak na ba luha mo sa keyboard?",
  "pikon na pikon yarn? tahan na",
  "mabilis magmabilis mag-reply pero umiiyak sa gilid",
  "taas ng presyon mo inom ka muna gamot",
  "subukan mong huwag umiyak ha?",
  "gamitin mo rin utak mo minsan hindi pang-display lang",
  "isang malaking papuri sa napakalaki mong katangahan",
  "patingin nga ng utak mo mukhang nabubulok na sa loob",
  "puro ka ebas wala namang utak ang sinasabi mo",
  "may discount ba sa katangahan ngayon? nakasale ka ata",
  "itatapon ko na sa basurahan yang sinabi mo",
  "paki-paliwanag ulit kaso gamitin mo naman utak mo",
  "may utak ka naman kaso bakit parang palamuti lang?",
  "nag-isip ka tapos nagkamali ka pa rin",
  "nakakalungkot isipin na ganyan ka katanga mag-isip",
  "sayang ang pinakain sa iyo ng magulang mo",
  "mabagal ka na nga mag-isip tanga ka pa mag-unawa",
  "puro ka dada wala ka namang maipagmamayabang",
  "mukha kang malaking joke sa sinabi mo",
  "walang-wala ka talagang maipagmamayabang noh?",
  "ikwento mo sa pagong baka may magtsamba na makinig",
  "sige lang wala namang nagtatanong sa iyo",
  "walang kwenta ang sinabi mo subukan mo ulit galingan",
  "magsalita ka lang diyan kunwari nakikinig ako",
  "ipagmayabang mo lang yan kahit walang may pakialam",
  "sino nagtanong sa iyo? wala naman pala",
  "dami mong sinabi pero hindi ko binasa",
  "nanonood lang ako sa kabobohan mo",
  "sumigaw ka pa nang mas malakas wala pa ring nakakarinig",
  "iba na lang pag-usapan nababagot ako sa mukha mo",
  "masarap kang kausap parang pader na may amag",
  "may tao pala rito? akala ko basura lang",
  "paki-chat kapag may kabuluhan na yang sinasabi mo",
  "diretso sa basurahan yang mga pinagsasabi mo",
  "busy kami sa pagtawa sa katangahan mo",
  "paalala lang: walang nagtatanong sa iyo",
  "ano pakialam namin sa nararamdaman mo?",
  "isulat mo sa papel tapos sunugin mo",
  "mas may kabuluhan pa makipag-usap sa semento",
  "saan nabibili ang kapal ng mukha mo?",
  "ibaba mo yabang mo baka matalisod ka sa katangahan mo",
  "maging clown ka na lang sa perya nang tuluyan",
  "walang nakikinig sa iyo pero sige magsalita ka lang mag-isa",
  "maganda ang speech mo kailan ang bitay?",
  "ang tapang mo sa chat sa personal naman mukha kang tuko",
  "sobrang nakakahiya ang sinasabi mo delete mo na",
  "magsalita ka lang mukha ka namang ewan",
  "palakpakan para sa pakiramdam magaling",
  "may amoy ba sinasabi mo o sadyang mabaho ka lang?",
  "magkano sweldo mo sa pagiging feelingero?",
  "taob kami sa iyo taob sa kabobohan",
  "patingin ka na sa doktor malala na yang sa iyo",
  "parang sirang plaka paulit-ulit na kabobohan",
  "sige lang suportahan ka namin sa ilusyon mo",
  "salamat sa comedy show mong walang kwenta",
  "huminga ka nang malalim baka mamatay ka sa galit",
  "tumahimik ka muna sobrang kapal ng mukha mo",
  "tama na muna baka maubusan ka ng laway",
  "huwag kang kabahan wala naman kaming inaasahan sa iyo",
  "wala bang bago? luma na yang pang-aasar mo",
  "ang taas ng tingin mo sa sarili mo san galing yan?",
  "sige habaan mo pa script mo drama queen"
];

/*
 * ============================================================
 * PURE ENGLISH ASAR REPLIES (HARD HITTING)
 * ============================================================
 */

const englishReplies = [
  "cry quietly behind your screen so nobody notices",
  "you are so mad right now and it shows",
  "wipe those tears away buddy you are embarrassing yourself",
  "calm down before you pop a vein in your neck",
  "go to sleep you clearly lack proper parenting",
  "cry a little more that is nowhere near enough",
  "are you upset? how miserable",
  "you are actually about to cry aren't you?",
  "keep typing did a tear fall on your phone yet?",
  "getting offended that fast is a skill",
  "keep acting tough to hide how hurt you are inside",
  "typing so fast but crying behind the screen",
  "check your blood pressure and take your medicine",
  "try your best not to cry right now",
  "use your brain for once it is not just for decoration",
  "congratulations on showing your absolute foolishness",
  "let me inspect your brain it looks completely unused",
  "so much talk zero intelligence behind it",
  "is stupidity on sale today? you bought the whole store",
  "throwing your message directly into the trash",
  "explain that again but use your brain this time",
  "you have a brain why treat it like a useless ornament?",
  "your thoughts loaded and crashed immediately",
  "it is genuinely sad watching you try to think",
  "what a waste of food your parents spent on you",
  "your brain is like slow connection useless and lagging",
  "all words zero substance",
  "you sound like a complete joke right now",
  "so you genuinely think you made a valid point?",
  "you literally have zero things to brag about",
  "tell that to a wall maybe it will pretend to listen",
  "nobody asked for your irrelevant opinion",
  "what you said made zero sense try again",
  "keep typing I am totally listening",
  "flex all you want nobody gives a damn",
  "who asked? absolutely no one",
  "you typed a whole essay and I still ignored it",
  "I am just spectating your foolishness",
  "shout louder still nobody hears your irrelevance",
  "next topic your input is extremely boring",
  "talking to you is like talking to a damp wall",
  "is someone there? thought it was just trash talking",
  "we are not wasting another second on you",
  "message again when your point actually makes sense",
  "sent straight to the recycle bin where you belong",
  "busy laughing at your pathetic attempts",
  "friendly reminder nobody asked you anything",
  "as if anyone gives a damn about your feelings",
  "write it down on paper and burn it",
  "desperate for attention aren't we?",
  "talking to a brick wall makes more sense than this",
  "where do you buy that level of unearned audacity?",
  "lower your ego you might trip on your own foolishness",
  "you should consider becoming a full-time perya clown",
  "nobody is listening but keep talking to yourself",
  "great speech when is the execution?",
  "so brave behind a keyboard so silent in real life",
  "that was insanely embarrassing to read delete it",
  "keep talking you sound completely ridiculous",
  "applause for someone pretending to be smart",
  "does your logic smell or are you just like that?",
  "how much do they pay you to act this confident?",
  "you completely embarrassed yourself here",
  "go see a doctor something is wrong with your head",
  "you sound like a broken record repeating nonsense",
  "keep going we support your delusions",
  "thanks for the comedy show absolute clownery",
  "breathe in breathe out don't pass out from anger",
  "turn down your volume your arrogance is too loud",
  "take a break you are running out of excuses",
  "don't be nervous we had zero expectations anyway",
  "got anything new? your insults are outdated",
  "such high self-esteem for someone with no brain",
  "keep writing your paragraph drama queen"
];

/*
 * ============================================================
 * PURE TAGALOG ASAR SUFFIXES
 * ============================================================
 */

const tagalogSuffixes = [
  "",
  "",
  "",
  " HAHAHA",
  " hahaha",
  " AHAHAHA",
  " bwahaha 🤣",
  " 😂",
  " 🤣",
  " 😭",
  " 💀",
  " 🥱",
  " 🗿",
  " 🤡",
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
  "...",
  "... haha",
  "... HAHAHA",
  "... 💀",
  "... 😭",
  "!",
  "!!",
  "?!",
  "?! 😂",
  "?! 💀",
  " subukan mo ulit 💀",
  " huwag ka maiiyak ha 😭",
  " paki-mura ako haha",
  " humingi ka muna ng permiso sa utak mo 🤡",
  " napakaganda ng kasinungalingan mo 💀",
  " mag-isip ka muna bago ka magsalita 😂",
  " ebas pa sige 🥱",
  " ipagpatuloy mo lang yang kabobohan mo 🗿",
  " umiiyak ka na ba? 😂",
  " iyak ka muna sa gilid 💀",
  " subukan mo pa nang mas magaling pikon 🤪",
  " napagaling mo naman maging clown 🗿",
  " palakpakan para sa katangahan 👏😂",
  " pikon ka na ba niyan? 🤣",
  " kawawa ka naman 😭",
  " oras na para umiyak ka 😭💀",
  " burahin mo na habang maaga pa napapahiya ka na 🤡"
];

/*
 * ============================================================
 * PURE ENGLISH ASAR SUFFIXES
 * ============================================================
 */

const englishSuffixes = [
  "",
  "",
  "",
  " HAHAHA",
  " hahaha",
  " AHAHAHA",
  " lol",
  " lmao",
  " lmao 💀",
  " lol 😭",
  " pffft 😂",
  " 😂",
  " 🤣",
  " 😭",
  " 💀",
  " 🥱",
  " 🗿",
  " 🤡",
  " 🤓",
  " 👀",
  " 🥱💀",
  " 🤓💀",
  " 😭😭",
  " 💀💀",
  " 😂😂",
  " 🤣🤣",
  " 😭💀",
  " 💀😂",
  " 🤡💀",
  " 🗿💀",
  " 👀💀",
  "...",
  "... haha",
  "... HAHAHA",
  "... 💀",
  "... 😭",
  "!",
  "!!",
  "?!",
  "?! 😂",
  "?! 💀",
  " try again clown 💀",
  " don't cry now 😭",
  " nice joke 💀",
  " speak when you actually have a brain 😂",
  " keep talking to the void 🥱",
  " continue your circus performance 🗿",
  " crying already? 😂",
  " go cry in the corner 💀",
  " try harder next time 🤪",
  " brilliant attempt at being stupid 🗿",
  " round of applause for the clown 👏😂",
  " upset already? 🤣",
  " pathetic effort 😭",
  " time to cry 😭💀",
  " delete this right now you are embarrassed 🤡",
  " completely humiliated 💀",
  " touch some grass 🌱💀",
  " nobody cares about you 💀",
  " side eye 😒💀",
  " purely delusional ✨🤡"
];

/*
 * ============================================================
 * RANDOM REPLY GENERATOR (STRICT LANGUAGE MATCH)
 * ============================================================
 */

function getRandomReply(threadID) {
  let reply;
  const lastReply = lastReplyByThread.get(threadID);

  const isTagalog = Math.random() < 0.5;

  do {
    if (isTagalog) {
      const baseText =
        tagalogReplies[
          Math.floor(Math.random() * tagalogReplies.length)
        ];
      const suffix =
        tagalogSuffixes[
          Math.floor(Math.random() * tagalogSuffixes.length)
        ];
      reply = baseText + suffix;
    } else {
      const baseText =
        englishReplies[
          Math.floor(Math.random() * englishReplies.length)
        ];
      const suffix =
        englishSuffixes[
          Math.floor(Math.random() * englishSuffixes.length)
        ];
      reply = baseText + suffix;
    }
  } while (
    reply === lastReply &&
    (tagalogReplies.length > 1 || englishReplies.length > 1)
  );

  lastReplyByThread.set(threadID, reply);

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

  if (prefix && text.startsWith(prefix)) {
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
  return OWNER_IDS.includes(String(senderID));
}

/*
 * ============================================================
 * TYPING INDICATOR
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
 * COMMAND EXECUTION
 * ============================================================
 */

module.exports.run = async function ({ api, event, args }) {
  const { threadID, senderID, messageID } = event;

  if (!isOwner(senderID)) {
    return api.sendMessage(
      "You do not have permission to use this command.",
      threadID,
      messageID
    );
  }

  const option = args[0] ? String(args[0]).toLowerCase() : "";

  if (option === "on" || option === ".") {
    sleepingThreads.add(String(threadID));
    saveThreads(sleepingThreads);
    react(api, messageID);

    return api.sendMessage(
      "Sleeping mode ON 🥷",
      threadID,
      messageID
    );
  }

  if (option === "off" || option === "..") {
    sleepingThreads.delete(String(threadID));
    saveThreads(sleepingThreads);
    cancelThreadTimers(threadID);
    react(api, messageID);

    return api.sendMessage(
      "Sleeping mode OFF 🔕",
      threadID,
      messageID
    );
  }

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

module.exports.handleEvent = function ({ api, event }) {
  const { threadID, senderID, body, messageID } = event;

  if (!body) return;

  try {
    if (String(senderID) === String(api.getCurrentUserID())) {
      return;
    }
  } catch (_) {}

  const text = String(body).trim();

  if (text === ".") {
    if (!isOwner(senderID)) return;
    sleepingThreads.add(String(threadID));
    saveThreads(sleepingThreads);
    react(api, messageID);
    return;
  }

  if (text === "..") {
    if (!isOwner(senderID)) return;
    sleepingThreads.delete(String(threadID));
    saveThreads(sleepingThreads);
    cancelThreadTimers(threadID);
    react(api, messageID);
    return;
  }

  if (text === "...") {
    if (!isOwner(senderID)) return;
    react(api, messageID);
    return;
  }

  if (!sleepingThreads.has(String(threadID))) {
    return;
  }

  if (isCommand(text)) {
    return;
  }

  if (isFlooding(threadID)) {
    return;
  }

  const now = Date.now();
  const lastSent = lastReplyTime.get(threadID) || 0;

  // 4.2 seconds minimum cooldown between consecutive triggers
  if (now - lastSent < 4200) {
    return;
  }

  const reply = getRandomReply(threadID);

  startTyping(api, threadID);

  // Random delay between 4.2 seconds (4200ms) and 6.0 seconds (6000ms)
  const randomDelay = Math.floor(Math.random() * (6000 - 4200 + 1)) + 4200;

  let timer;

  timer = setTimeout(() => {
    removeTimer(threadID, timer);

    if (!sleepingThreads.has(String(threadID))) {
      return;
    }

    try {
      api.sendMessage(reply, threadID, messageID);
      lastReplyTime.set(threadID, Date.now());
    } catch (err) {
      console.log("[SLEEPING] Send error:", err.message);
    }
  }, randomDelay);

  addTimer(threadID, timer);
};

module.exports.handleReply = function () {};
module.exports.handleReaction = function () {};
