const { cmd } = require("../nox.js");
const config = require("../config.js");

cmd({
    pattern: "ping",
    alias: ["p"],
    desc: "Check bot speed",
    category: "main"
}, async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();
        const sent = await conn.sendMessage(from, { text: "🏓 Pinging..." }, { quoted: mek });
        const speed = Date.now() - start;

        const text =
            `╭─❏ ${config.BOT_NAME || "NOX FREE MINI BOT"} ❏\n` +
            `│ 🏓 Pong!\n` +
            `│ Latence: ${speed}ms\n` +
            `╰═───────────────═⬡\n\n` +
            `${config.BOT_FOOTER || ""}`;

        try {
            await conn.sendMessage(from, { text, edit: sent.key });
        } catch (editError) {
            await conn.sendMessage(from, { text }, { quoted: mek });
        }
    } catch (error) {
        console.error("PING COMMAND ERROR:", error);
        await reply(`Ping failed: ${error.message}`);
    }
});
