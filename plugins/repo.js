const { cmd } = require('../sidd');
const config = require('../config');
const { t } = require('../lib/i18n');
const { siddTechx } = require('../lib/style');
const { randomImage } = require('../lib/images');

// ═══════════════════════════════════════
// 📦 REPO
// ═══════════════════════════════════════
cmd({
    pattern: "repo",
    alias: ["sc", "sourcecode", "github"],
    desc: "Show the bot's repository link",
    category: "main",
    react: "📦",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const repoUrl = config.REPO_URL || 'https://daraxii-nx.up.railway.app';
        const botName = config.BOT_NAME || '';

        return conn.sendMessage(from, { image: { url: randomImage() }, caption: siddTechx(
            'REPO*',
            `To pair the bot, open this link:\n${repoUrl}`,
            '📦'
        ) }, { quoted: mek });

    } catch (error) {
        console.error('REPO ERROR:', error);
        reply(siddTechx('REPO', t(from, 'error_occurred'), '❌'));
    }
});
