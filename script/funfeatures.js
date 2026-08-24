module.exports = {
    name: "funfeatures",
    description: "Love calculator, ship, and random quote generator",
    async execute(api, event, args) {
        const { threadID, messageID, mentions } = event;
        const cmd = args[0]?.toLowerCase();

        if (cmd === "ship" || cmd === "love") {
            const names = args.slice(1).join(" ");
            if (!names) return api.sendMessage("Maglagay ng dalawang pangalan o i-tag sila (hal. !ship Pangalan at Pangalan).", threadID, messageID);
            
            const matchPercentage = Math.floor(Math.random() * 101);
            let message = `💖 Love Match Calculator 💖\n\nPinag-dugtong: ${names}\nMatch Rate: ${matchPercentage}% ❤️`;
            
            if (matchPercentage > 80) message += "\nAyieee! Perfect match ito! 🥰";
            else if (matchPercentage < 40) message += "\nNaku, medyo malabo kayo dyan ha. 😂";
            else message += "\nMay potensyal naman! ✨";

            return api.sendMessage(message, threadID, messageID);
        }

        if (cmd === "quote") {
            const quotes = [
                "“Ang buhay ay hindi parang patatas, na kapag naubos ay wala na.” - Kurapika",
                "“Huwag mong ipagpalit ang tulog sa simpleng chat lang.” - Sinzu Bot",
                "“Lahat ng mahirap ay madali kung hindi mo gagawin.” - Master"
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            return api.sendMessage(`📜 Panandaliang Aral:\n\n${randomQuote}`, threadID, messageID);
        }
    }
};