module.exports = {
    name: "system",
    description: "help, ping, uptime, info, uid",
    async execute(api, event, args) {
        const { threadID, messageID, senderID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "help") {
            return api.sendMessage("📜 𝙎𝙄𝙉𝙕𝙐 𝙈𝙀𝙎𝙎𝙉𝙂𝙍𝘽𝙊𝙏 ✨\nTingnan ang menu para sa kumpletong listahan ng mga commands.", threadID, messageID);
        }
        if (cmd === "ping") {
            return api.sendMessage("Pong! 🏓 Latency is stable.", threadID, messageID);
        }
        if (cmd === "uptime") {
            return api.sendMessage("🌐 𝚂𝚝𝚊𝚝𝚞𝚜 : 𝙾𝚗𝚕𝚒𝚗𝚎 🟢 (Bot is running smoothly)", threadID, messageID);
        }
        if (cmd === "info" || cmd === "about") {
            return api.sendMessage("📊 𝚃𝚘𝚝𝚊𝚕 : 30 𝙲𝚖𝚍𝚜\n👤 𝙳𝚎𝚟 : 𝙺𝚞𝚛𝚊𝚙𝚒𝚔𝚊\n🌐 𝚂𝚝𝚊𝚝𝚞𝚜 : 𝙾𝚗𝚕𝚒𝚗𝚎 🟢", threadID, messageID);
        }
        if (cmd === "uid") {
            return api.sendMessage(`👤 Ang iyong Facebook User ID ay: ${senderID}`, threadID, messageID);
        }
    }
};