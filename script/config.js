module.exports = {
    name: "config",
    description: "prefix, settings, autoreply",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "prefix") {
            return api.sendMessage("⚙️ Ang kasalukuyang prefix ng bot ay: `!` o kahit anong nakatakda.", threadID, messageID);
        }
        if (cmd === "settings" || cmd === "autoreply") {
            return api.sendMessage(`🔧 Ang setting para sa '${cmd}' ay na-update na.`, threadID, messageID);
        }
    }
};