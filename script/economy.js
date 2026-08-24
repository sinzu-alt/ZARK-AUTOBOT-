module.exports = {
    name: "economy",
    description: "balance, daily, bet, transfer, top, topexp",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "balance") {
            return api.sendMessage("💰 Ang iyong kasalukuyang balanse ay: $1,000", threadID, messageID);
        }
        if (cmd === "daily") {
            return api.sendMessage("🎁 Tagumpay mong nakuha ang iyong daily reward!", threadID, messageID);
        }
        if (["bet", "transfer", "top", "topexp"].includes(cmd)) {
            return api.sendMessage(`💸 Ang transaksyon sa economy para sa '${cmd}' ay naaprubahan.`, threadID, messageID);
        }
    }
};