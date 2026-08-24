module.exports = {
    name: "image",
    description: "pin, rbg, imginfo",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (["pin", "rbg", "imginfo"].includes(cmd)) {
            return api.sendMessage(`🖼️ Pinoproseso ang imahe para sa command na '${cmd}'.`, threadID, messageID);
        }
    }
};