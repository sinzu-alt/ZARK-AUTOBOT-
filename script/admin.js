module.exports = {
    name: "admin",
    description: "adduser, removeuser, setadmin, groupinfo, permissions, setbalance",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (["adduser", "removeuser", "setadmin", "groupinfo", "permissions", "setbalance"].includes(cmd)) {
            return api.sendMessage(`🛡️ Ang command na '${cmd}' ay naisakatuparan para sa Admin privileges.`, threadID, messageID);
        }
    }
};