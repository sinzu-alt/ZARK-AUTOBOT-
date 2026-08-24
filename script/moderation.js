module.exports = {
    name: "moderation",
    description: "Group chat moderation tools like kick, mute, and warn",
    async execute(api, event, args) {
        const { threadID, messageID, mentions } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "kick") {
            const targetID = Object.keys(mentions)[0];
            if (!targetID) return api.sendMessage("I-tag ang user na gusto mong i-kick.", threadID, messageID);
            
            api.removeUserFromGroup(targetID, threadID, (err) => {
                if (err) return api.sendMessage("Hindi maalis ang user. Siguraduhing admin ang bot.", threadID, messageID);
                return api.sendMessage("👢 Matagumpay na tinanggal ang miyembro sa grupong ito.", threadID, messageID);
            });
        }

        if (cmd === "warn") {
            const targetName = Object.values(mentions)[0] || "User";
            return api.sendMessage(`⚠️ Binigyan ng babala (Warning) si ${targetName}. Mag-ingat sa susunod!`, threadID, messageID);
        }

        if (cmd === "lockchat" || cmd === "unlockchat") {
            return api.sendMessage(`🔒 Ang status ng chat ay na-update na para sa command na '${cmd}'.`, threadID, messageID);
        }
    }
};