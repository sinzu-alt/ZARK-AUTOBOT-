module.exports = {
    name: "guide",
    description: "tuts, rules, about",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "tuts") {
            return api.sendMessage("📖 Paano gamitin: I-type ang prefix kasunod ng command name (hal. !help).", threadID, messageID);
        }
        if (cmd === "rules") {
            return api.sendMessage("📜 Mga patakaran: Huwag i-spam ang bot at respetuhin ang bawat miyembro.", threadID, messageID);
        }
        if (cmd === "about") {
            return api.sendMessage("✨ 𝙎𝙄𝙉𝙕𝙐 𝙈𝙀𝙎𝙎𝙉𝙂𝙍𝘽𝙊𝙏 binuo para sa madaling pamamahala at kasiyahan.", threadID, messageID);
        }
    }
};