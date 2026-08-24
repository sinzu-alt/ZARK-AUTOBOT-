module.exports = {
    name: "game",
    description: "slot, megaslot",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "slot" || cmd === "megaslot") {
            return api.sendMessage("🎰 🍒 | 🍋 | 🍊 — Naka-spin ka sa slot machine!", threadID, messageID);
        }
    }
};