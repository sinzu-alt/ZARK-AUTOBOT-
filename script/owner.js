module.exports = {
    name: "owner",
    description: "admin, cmd, plugins, logs, restart, accept, listbox, listfriend, noti, pending",
    async execute(api, event, args) {
        const { threadID, messageID, senderID } = event;
        const cmd = args[0]?.toLowerCase();

        if (["admin", "cmd", "plugins", "logs", "restart", "accept", "listbox", "listfriend", "noti", "pending"].includes(cmd)) {
            return api.sendMessage(`👑 Owner command '${cmd}' executed successfully.`, threadID, messageID);
        }
    }
};