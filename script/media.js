module.exports = {
    name: "media",
    description: "song, yt, lyrics, gif",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();
        const query = args.slice(1).join(" ");

        if (["song", "yt", "lyrics", "gif"].includes(cmd)) {
            if (!query) return api.sendMessage(`Maglagay ng pangalan o link para sa ${cmd}.`, threadID, messageID);
            return api.sendMessage(`🎵 Pinoproseso ang media para sa '${query}'...`, threadID, messageID);
        }
    }
};