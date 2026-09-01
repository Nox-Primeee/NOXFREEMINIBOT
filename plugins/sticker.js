const { t } = require('../lib/i18n');
// plugins/sticker.js — Create a sticker from image/video/gif
const { cmd } = require("../sidd");
const { fakevCard } = require('../lib/fakevCard');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
const webpmux = require('node-webpmux');
const config = require('../config');
const style = require('../lib/style');
ffmpeg.setFfmpegPath(ffmpegPath);

async function downloadMedia(msgContent, type) {
    const stream = await downloadContentFromMessage(msgContent, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    return buffer;
}

async function imageToWebp(buffer) {
    const inputPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex') + '.jpg');
    const outputPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp');
    fs.writeFileSync(inputPath, buffer);

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,format=rgba,pad=512:512:-1:-1:color=#00000000"
            ])
            .toFormat('webp')
            .save(outputPath);
    });

    const webp = fs.readFileSync(outputPath);
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    return webp;
}

async function videoToWebp(buffer) {
    const inputPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex') + '.mp4');
    const outputPath = path.join(os.tmpdir(), crypto.randomBytes(6).toString('hex') + '.webp');
    fs.writeFileSync(inputPath, buffer);

    await new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .on('error', reject)
            .on('end', () => resolve(true))
            .addOutputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,fps=15,pad=512:512:-1:-1:color=#00000000,split [a][b];[a] palettegen=reserve_transparent=on:transparency_color=ffffff [p];[b][p] paletteuse",
                '-loop', '0',
                '-ss', '00:00:00',
                '-t', '00:00:06',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .save(outputPath);
    });

    const webp = fs.readFileSync(outputPath);
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    return webp;
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
    pattern: "sticker",
    alias: ['s', '.'],
    desc: "Create a sticker from an image or video/gif",
    category: "info",
    filename: __filename,
}, async (conn, mek, m, { from, reply, pushname }) => {
    try {
        const quoted = m.quoted ? m.quoted.message : null;
        const type = quoted ? Object.keys(quoted)[0] : m.mtype;

        let mediaMsg, mediaType;

        if (type === 'imageMessage') {
            mediaMsg = quoted ? quoted.imageMessage : m.msg;
            mediaType = 'image';
        } else if (type === 'videoMessage') {
            mediaMsg = quoted ? quoted.videoMessage : m.msg;
            mediaType = 'video';
        } else {
            return reply(style.box('STICKER', 'SEND OR REPLY TO AN IMAGE OR VIDEO/GIF (MAX 10S) WITH THE STICKER COMMAND.'));
        }

        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const buffer = await downloadMedia(mediaMsg, mediaType);
        let webpBuffer = mediaType === 'image'
            ? await imageToWebp(buffer)
            : await videoToWebp(buffer);

        const author = pushname || config.AUTHOR || '🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸';
        webpBuffer = await addExif(webpBuffer, config.PACKNAME || 'DARAXII-NX STICKER HUB', author);

        await conn.sendMessage(from, { sticker: webpBuffer }, { quoted: fakevCard });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (err) {
        console.error("STICKER ERROR:", err);
        reply(style.error('ERROR WHILE CREATING THE STICKER.'));
    }
});
