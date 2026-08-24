module.exports = {
    name: "funextra",
    description: "More fun games like truth or dare, coinflip, and rps",
    async execute(api, event, args) {
        const { threadID, messageID } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "coinflip" || cmd === "coin") {
            const result = Math.random() < 0.5 ? "🪙 HEADS (Ulo)" : "🪙 TAILS (Buntot)";
            return api.sendMessage(`Resulta ng barya: ${result}`, threadID, messageID);
        }

        if (cmd === "tod" || cmd === "truthordare") {
            const choices = ["Truth: Sino ang pinakahuling taong pinadalhan mo ng mensahe?", "Dare: Mag-send ng random emoji sa huling chat mo."];
            const pick = choices[Math.floor(Math.random() * choices.length)];
            return api.sendMessage(`🎮 Truth or Dare:\n\n${pick}`, threadID, messageID);
        }

        if (cmd === "rps") {
            const options = ["bato", "papel", "gunting"];
            const botChoice = options[Math.floor(Math.random() * options.length)];
            return api.sendMessage(`✊ Bato, Papel, Gunting!\n\nNaglabas ang bot ng: **${botChoice}**`, threadID, messageID);
        }
    }
};