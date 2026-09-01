const { cmd } = require("../sidd.js");
const config = require("../config.js");

cmd({
    pattern: "ping",
    alias: ["p"],
    desc: "Check bot speed",
    category: "main"
}, async (m, sock) => {
    const start = Date.now();
    const sent = await sock.sendMessage(m.from, { text: "🏓 Pinging..." }, { quoted: m.raw });
    const speed = Date.now() - start;

    const text =
        `╭─❏ ${config.BOT_NAME}❏\n` +
        `│ 🏓 Pong!\n` +
        `│ Latence: ${speed}ms\n` +
      `╰═───────────────═⬡\n\n` +
        `${config.FOOTER}`;

    await sock.sendMessage(m.from, { text, edit: sent.key }, {}).catch(async () => {
        await sock.sendMessage(m.from, { text }, { quoted: m.raw });
    });
});
