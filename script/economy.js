const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_FILE = path.join(DATA_DIR, "economy.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadDB() {
    try {
        if (!fs.existsSync(DB_FILE)) {
            fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
        }

        return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
    } catch (err) {
        console.error("[ECONOMY] Database error:", err);
        return {};
    }
}

function saveDB(db) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function getUser(db, userID) {
    if (!db[userID]) {
        db[userID] = {
            balance: 1000,
            exp: 0,
            level: 1,
            lastDaily: 0,
            totalEarned: 1000
        };
    }

    return db[userID];
}

function addExp(user) {
    const required = user.level * 100;

    if (user.exp >= required) {
        user.exp -= required;
        user.level++;

        return true;
    }

    return false;
}

function formatMoney(amount) {
    return Number(amount).toLocaleString("en-US");
}

module.exports = {
    name: "economy",
    description: "Economy system: balance, daily, bet, transfer, top, topexp",

    async execute(api, event, args) {
        const { threadID, messageID, senderID } = event;

        const db = loadDB();
        const user = getUser(db, senderID);

        const cmd = (args[0] || "").toLowerCase();

        // =========================
        // 💰 BALANCE
        // =========================
        if (cmd === "balance" || cmd === "bal") {
            return api.sendMessage(
`╭━━━〔 💰 ECONOMY 〕━━━╮
┃
┃ 👤 User: ${senderID}
┃ 💵 Balance: $${formatMoney(user.balance)}
┃ ⭐ Level: ${user.level}
┃ ✨ EXP: ${user.exp}/${user.level * 100}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`,
                threadID,
                messageID
            );
        }

        // =========================
        // 🎁 DAILY
        // =========================
        if (cmd === "daily") {
            const now = Date.now();
            const cooldown = 24 * 60 * 60 * 1000;

            if (now - user.lastDaily < cooldown) {
                const remaining = cooldown - (now - user.lastDaily);

                const hours = Math.floor(remaining / 3600000);
                const minutes = Math.floor(
                    (remaining % 3600000) / 60000
                );

                return api.sendMessage(
                    `⏳ Daily reward already claimed!\n\n` +
                    `🎁 Come back in ${hours}h ${minutes}m.`,
                    threadID,
                    messageID
                );
            }

            const reward = Math.floor(Math.random() * 501) + 500;

            user.balance += reward;
            user.totalEarned += reward;
            user.lastDaily = now;

            user.exp += 25;

            const leveledUp = addExp(user);

            saveDB(db);

            let msg =
`╭━━━〔 🎁 DAILY REWARD 〕━━━╮
┃
┃ 💵 Reward: +$${formatMoney(reward)}
┃ 💰 Balance: $${formatMoney(user.balance)}
┃ ✨ EXP: +25
┃ ⭐ Level: ${user.level}
┃`;

            if (leveledUp) {
                msg += `
┃ 🎉 LEVEL UP!
┃ ⭐ New Level: ${user.level}
┃`;
            }

            msg += `
╰━━━━━━━━━━━━━━━━━━━━╯`;

            return api.sendMessage(msg, threadID, messageID);
        }

        // =========================
        // 🎲 BET
        // =========================
        if (cmd === "bet") {
            const amount = Number(args[1]);

            if (!amount || amount <= 0) {
                return api.sendMessage(
                    "❌ Usage: economy bet <amount>",
                    threadID,
                    messageID
                );
            }

            if (amount > user.balance) {
                return api.sendMessage(
                    "❌ Hindi sapat ang balance mo para sa bet na ito.",
                    threadID,
                    messageID
                );
            }

            const win = Math.random() < 0.5;

            if (win) {
                user.balance += amount;
                user.totalEarned += amount;

                saveDB(db);

                return api.sendMessage(
`🎲 BET RESULT

🎉 YOU WON!

💵 Profit: +$${formatMoney(amount)}
💰 Balance: $${formatMoney(user.balance)}`,
                    threadID,
                    messageID
                );
            }

            user.balance -= amount;

            saveDB(db);

            return api.sendMessage(
`🎲 BET RESULT

💀 YOU LOST!

💸 Lost: -$${formatMoney(amount)}
💰 Balance: $${formatMoney(user.balance)}`,
                threadID,
                messageID
            );
        }

        // =========================
        // 💸 TRANSFER
        // =========================
        if (cmd === "transfer") {
            const targetID = args[1];
            const amount = Number(args[2]);

            if (!targetID || !amount || amount <= 0) {
                return api.sendMessage(
                    "❌ Usage: economy transfer <userID> <amount>",
                    threadID,
                    messageID
                );
            }

            if (targetID === senderID) {
                return api.sendMessage(
                    "❌ Hindi mo puwedeng i-transfer sa sarili mo.",
                    threadID,
                    messageID
                );
            }

            if (amount > user.balance) {
                return api.sendMessage(
                    "❌ Hindi sapat ang balance mo.",
                    threadID,
                    messageID
                );
            }

            const receiver = getUser(db, targetID);

            user.balance -= amount;
            receiver.balance += amount;

            saveDB(db);

            return api.sendMessage(
`╭━━━〔 💸 TRANSFER 〕━━━╮
┃
┃ 👤 Sender: ${senderID}
┃ 👤 Receiver: ${targetID}
┃ 💵 Amount: $${formatMoney(amount)}
┃
┃ 💰 Your Balance:
┃ $${formatMoney(user.balance)}
┃
╰━━━━━━━━━━━━━━━━━━━━╯`,
                threadID,
                messageID
            );
        }

        // =========================
        // 🏆 TOP BALANCE
        // =========================
        if (cmd === "top") {
            const ranking = Object.entries(db)
                .sort((a, b) => b[1].balance - a[1].balance)
                .slice(0, 10);

            if (!ranking.length) {
                return api.sendMessage(
                    "📭 Wala pang economy users.",
                    threadID,
                    messageID
                );
            }

            let msg = "╭━━━〔 🏆 TOP BALANCE 〕━━━╮\n┃\n";

            ranking.forEach(([id, data], index) => {
                msg +=
                    `┃ ${index + 1}. 👤 ${id}\n` +
                    `┃    💰 $${formatMoney(data.balance)}\n`;
            });

            msg += "┃\n╰━━━━━━━━━━━━━━━━━━━━╯";

            return api.sendMessage(msg, threadID, messageID);
        }

        // =========================
        // ⭐ TOP EXP
        // =========================
        if (cmd === "topexp") {
            const ranking = Object.entries(db)
                .sort((a, b) => {
                    if (b[1].level !== a[1].level) {
                        return b[1].level - a[1].level;
                    }

                    return b[1].exp - a[1].exp;
                })
                .slice(0, 10);

            let msg = "╭━━━〔 ⭐ TOP EXP 〕━━━╮\n┃\n";

            ranking.forEach(([id, data], index) => {
                msg +=
                    `┃ ${index + 1}. 👤 ${id}\n` +
                    `┃    ⭐ Level ${data.level}\n` +
                    `┃    ✨ EXP ${data.exp}\n`;
            });

            msg += "┃\n╰━━━━━━━━━━━━━━━━━━━━╯";

            return api.sendMessage(msg, threadID, messageID);
        }

        // =========================
        // ❓ HELP
        // =========================
        if (!cmd || cmd === "help") {
            return api.sendMessage(
`╭━━━〔 💎 ECONOMY SYSTEM 〕━━━╮
┃
┃ 💰 balance
┃ 🎁 daily
┃ 🎲 bet <amount>
┃ 💸 transfer <userID> <amount>
┃ 🏆 top
┃ ⭐ topexp
┃
╰━━━━━━━━━━━━━━━━━━━━╯`,
                threadID,
                messageID
            );
        }
    }
};
