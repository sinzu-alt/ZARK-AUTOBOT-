module.exports = {
    name: "tools",
    description: "Extra tools like short url, qr code, and password generator",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();
        const text = args.slice(1).join(" ");

        if (cmd === "qr") {
            if (!text) return api.sendMessage("Maglagay ng text o link para gawan ng QR code.", threadID, messageID);
            return api.sendMessage(`📷 Gumagawa ng QR code para sa: "${text}"`, threadID, messageID);
        }
        
        if (cmd === "password" || cmd === "pass") {
            const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            return api.sendMessage(`🔐 Ang nabuo mong secure password ay: ${randomPass}`, threadID, messageID);
        }

        if (cmd === "shorten") {
            if (!text) return api.sendMessage("Maglagay ng URL na paiikliin.", threadID, messageID);
            return api.sendMessage(`🔗 Pinapaikli ang link: ${text}...`, threadID, messageID);
        }
    }
};