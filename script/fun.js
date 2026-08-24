module.exports = {
    name: "fun",
    description: "kiss, hug, joke, 8ball, roll, trash",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "joke") {
            return api.sendMessage("😂 Bakit pabilog ang pisara sa eskwelahan? Kasi kung parisukat, e di kahon na yun!", threadID, messageID);
        }
        if (["kiss", "hug", "8ball", "roll", "trash"].includes(cmd)) {
            return api.sendMessage(`✨ Na-execute ang fun command na '${cmd}'.`, threadID, messageID);
        }
    }
};