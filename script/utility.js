module.exports = {
    name: "utility",
    description: "calc, time, weather, translate, loc, spy, temp",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "calc") {
            return api.sendMessage("🔢 Calculator feature: Mangyaring ilagay ang equation (hal. calc 5 + 5).", threadID, messageID);
        }
        if (cmd === "time") {
            return api.sendMessage(`⏰ Ang kasalukuyang oras ay: ${new Date().toLocaleTimeString()}`, threadID, messageID);
        }
        if (cmd === "weather" || cmd === "temp") {
            return api.sendMessage("🌤️ Kinukuha ang impormasyon ng panahon...", threadID, messageID);
        }
        if (cmd === "translate") {
            return api.sendMessage("🌐 Translate feature: Ilagay ang text na isasalin.", threadID, messageID);
        }
        if (cmd === "loc" || cmd === "spy") {
            return api.sendMessage("📍 Location/Spy tool executed.", threadID, messageID);
        }
    }
};