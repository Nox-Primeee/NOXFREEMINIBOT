const { t } = require('../lib/i18n');
// plugins/take.js — "Take" a sticker: rename the pack/author
const { cmd } = require("../sidd");
const { fakevCard } = require('../lib/fakevCard');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const webpmux = require('node-webpmux');
const crypto = require('crypto');
const config = require('../config');
const style = require('../lib/style');

async function downloadMedia(msgContent, type) {
    const stream = await downloadContentFromMessage(msgContent, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

async function addExif(webpBuffer, packname, author) {
    const img = new webpmux.Image();
    await img.load(webpBuffer);

    const json = {
        'sticker-pack-id': crypto.randomBytes(8).toString('hex'),
        'sticker-pack-name': packname,
        'sticker-pack-publisher': author,
        'emojis': ['🤖']
    };

    const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
    const jsonBuff = Buffer.from(JSON.stringify(json), 'utf-8');
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);

    img.exif = exif;
    return await img.save(null);
}

cmd({
    pattern: "take",
    desc: "Reuse a sticker with your own pack/author",
    category: "info",
    filename: __filename,
}, async (conn, mek, m, { from, args, reply, pushname }) => {
    try {
        const quoted = m.quoted ? m.quoted.message : null;
        if (!quoted || !quoted.stickerMessage) {
            return reply(style.box('TAKE', 'REPLY TO A STICKER WITH THE TAKE COMMAND TO REUSE IT.\n\nEXAMPLE: take My Pack (optional)'));
        }

        const input = args.join(' ');
        const packname = input.trim() || (config.PACKNAME || '🪐');
        const author = pushname || config.AUTHOR || '🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸';

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const buffer = await downloadMedia(quoted.stickerMessage, 'sticker');
        const webpBuffer = await addExif(buffer, packname, author);

        await conn.sendMessage(from, { sticker: webpBuffer }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("TAKE ERROR:", err);
        reply(style.error('ERROR WHILE PROCESSING THE STICKER.'));
    }
});
