module.exports = {
    name: "ai",
    description: "AI, ask, chat, sanji commands",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();
        const query = args.slice(1).join(" ");

        if (["ai", "ask", "chat", "sanji"].includes(cmd)) {
            if (!query && cmd !== "ai") return api.sendMessage("Anong gusto mong itanong o pag-usapan?", threadID, messageID);
            return api.sendMessage(`🤖 [AI Response]: Naproseso ko ang iyong kahilingan para sa command na "${cmd}".`, threadID, messageID);
        }
    }
};