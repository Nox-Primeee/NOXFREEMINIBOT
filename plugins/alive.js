const { cmd } = require('../sidd');
const config = require('../config');
const { randomImage } = require('../lib/images');
const { t } = require('../lib/i18n');
const style = require('../lib/style');
const os = require('os');
const fs = require('fs');
const path = require('path');
const { runtime } = require('../lib/functions');

cmd({
    pattern: "alive",
    desc: "Check bot alive status and response details",
    category: "main",
    react: "💚",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const start = Date.now();
        await conn.sendMessage(from, { react: { text: "⚡", key: mek.key } });
        const end = Date.now();
        const pingTime = end - start;

        const botName = config.BOT_NAME || 'SIDD FREE BOT';
        const botNumber = conn.user.id.split(':')[0];
        const ownerNumber = config.OWNER_NUMBER || '33751103165';
        const liveMsg = config.LIVE_MSG || t(from, 'alive_running');
        const aliveImage = config.ALIVE_IMG || randomImage();

        const usedMemory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(1);
        const cpuUsage = os.loadavg()[0].toFixed(1);
        const uptime = runtime(process.uptime());

        let statusEmoji = "🟢", statusText = t(from, 'alive_fast');
        if (pingTime > 500) {
            statusEmoji = "🟡";
            statusText = t(from, 'alive_slow');
        } else if (pingTime > 200) {
            statusEmoji = "🟠";
            statusText = t(from, 'alive_good');
        }

        const message = `${style.box(botName, [
            `${t(from, 'alive_label')}: ${liveMsg} ${statusEmoji}`,
            `${t(from, 'alive_response')}: ${pingTime}ms`,
            `${t(from, 'alive_status')}: ${statusText}`,
            `${t(from, 'menu_bot')}: ${botName}`,
            `${t(from, 'menu_owner')}: ${ownerNumber}`,
            `${t(from, 'alive_number')}: ${botNumber}`,
            `${t(from, 'alive_ram')}: ${usedMemory}MB / ${totalMemory}GB`,
            `${t(from, 'alive_cpu')}: ${cpuUsage}%`,
            `${t(from, 'alive_mode')}: 🟢 ${t(from, 'alive_online')}`,
            `${t(from, 'alive_uptime')}: ${uptime}`
        ])}\n\n> ${config.BOT_FOOTER || '*𝐌ade 𝐈n 𝐁y 𝐒idd 𝐓echx 𝐎fc*'} ✅`;

        const imageSource = /^https?:\/\//i.test(aliveImage)
            ? { url: aliveImage }
            : fs.existsSync(path.resolve(aliveImage))
                ? fs.readFileSync(path.resolve(aliveImage))
                : { url: randomImage() };

        try {
            await conn.sendMessage(from, {
                image: imageSource,
                caption: message
            }, { quoted: mek });
        } catch (mediaError) {
            console.error('ALIVE IMAGE SEND ERROR, TEXT FALLBACK USED:', mediaError);
            await reply(message);
        }

        if (pingTime < 200) {
            await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });
        } else if (pingTime < 500) {
            await conn.sendMessage(from, { react: { text: "⚠️", key: mek.key } });
        } else {
            await conn.sendMessage(from, { react: { text: "🐌", key: mek.key } });
        }

    } catch (error) {
        console.error("ALIVE COMMAND ERROR:", error);
        await reply(style.error(`${t(from, 'error_occurred')}: ${error.message}`));
        await conn.sendMessage(from, { react: { text: "❌", key: mek.key } });
    }
});

