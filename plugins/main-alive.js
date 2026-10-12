
const { cmd, commands } = require('../nox');
const os = require("os");
const { runtime } = require('../lib/function');
const config = require('../config');
const { randomImage } = require('../lib/images');
const { t } = require('../lib/i18n');
const style = require('../lib/style');



cmd({
    pattern: "info",
    desc: "Check uptime and system status",
    category: "main",
    react: "👑",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply }) => {
    try {
        const totalCmds = commands.length;
        const uptime = () => {
            let sec = process.uptime();
            let h = Math.floor(sec / 3600);
            let m = Math.floor((sec % 3600) / 60);
            let s = Math.floor(sec % 60);
            return `${h}h ${m}m ${s}s`;
        };

        const status = `${style.box(`${config.BOT_NAME || 'NOX FREE MINI BOT'} INFO`, [
            `${t(from, 'alive_mode')}: ${config.MODE || 'private'}`,
            `${t(from, 'menu_owner')}: ${config.OWNER_NAME || config.BOT_NAME || 'NOX'}`,
            `${t(from, 'menu_prefix')}: ${config.PREFIX || '.'}`,
            `${t(from, 'menu_version')}: 1.0.0`,
            `${t(from, 'menu_commands')}: ${totalCmds}`,
            `${t(from, 'alive_uptime')}: ${uptime()}`
        ])}\n\n> *🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸*`;

        await conn.sendMessage(from, {
            image: { url: randomImage() },
            caption: status,
            contextInfo: {
                mentionedJid: [sender],   // ✅ FIXED
                forwardingScore: 999,
                isForwarded: true
            }
        }, { quoted: mek });

    } catch (e) {
        console.error("INFO COMMAND ERROR:", e);
        reply(style.error(`${t(from, 'error_occurred')}: ${e.message}`));
    }
});
