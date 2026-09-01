const { cmd } = require('../sidd');
const config = require('../config');
const { t } = require('../lib/i18n');
const style = require('../lib/style');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ─────────────────────────────────────────────
// TOURL - Upload media to Catbox and get URL
// ─────────────────────────────────────────────

cmd({
    pattern: 'tourl',
    alias: ['imgtourl', 'imgurl', 'url', 'geturl', 'upload'],
    react: '💫',
    desc: 'Upload media to Catbox and get direct URL',
    category: 'tools',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    let tempFilePath = null;

    try {
        // ─── CHECK QUOTED ───
        const quoted = m.quoted || mek.quoted;

        if (!quoted) {
            return reply(
                style.box('TOURL', [
                    '❌ ' + t(from, 'tourl_no_media'),
                    '',
                    `📌 ${t(from, 'tourl_usage', { prefix: config.PREFIX || '.' })}`,
                    '',
                    `📌 ${t(from, 'tourl_example', { prefix: config.PREFIX || '.' })}`
                ])
            );
        }

        const quotedMsg = quoted.message || quoted;
        const mimeType = quotedMsg.mimetype || '';

        if (!mimeType) {
            return reply(style.box('TOURL', ['❌ ' + t(from, 'tourl_invalid_media')]));
        }

        // ─── DOWNLOAD MEDIA ───
        await conn.sendMessage(from, { react: { text: '⏳', key: mek.key } });

        const mediaBuffer = await quoted.download();

        if (!mediaBuffer) {
            return reply(style.box('TOURL', ['❌ ' + t(from, 'tourl_download_failed')]));
        }

        // ─── DETERMINE EXTENSION ───
        let extension = '';
        if (mimeType.includes('image/jpeg')) extension = '.jpg';
        else if (mimeType.includes('image/png')) extension = '.png';
        else if (mimeType.includes('video')) extension = '.mp4';
        else if (mimeType.includes('audio')) extension = '.mp3';
        else if (mimeType.includes('sticker')) extension = '.webp';
        else extension = '.bin';

        // ─── SAVE TEMP FILE ───
        tempFilePath = path.join(os.tmpdir(), `catbox_${Date.now()}${extension}`);
        fs.writeFileSync(tempFilePath, mediaBuffer);

        // ─── UPLOAD TO CATBOX ───
        const form = new FormData();
        form.append('fileToUpload', fs.createReadStream(tempFilePath), `file${extension}`);
        form.append('reqtype', 'fileupload');

        const uploadResponse = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders()
        });

        const mediaUrl = uploadResponse.data.trim();

        if (tempFilePath && fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
            tempFilePath = null;
        }

        if (!mediaUrl || !mediaUrl.startsWith('http')) {
            return reply(style.box('TOURL', ['❌ ' + t(from, 'tourl_upload_failed')]));
        }

        // ─── DETERMINE MEDIA TYPE ───
        let mediaType = 'File';
        if (mimeType.includes('image')) mediaType = 'Image';
        else if (mimeType.includes('video')) mediaType = 'Video';
        else if (mimeType.includes('audio')) mediaType = 'Audio';
        else if (mimeType.includes('sticker')) mediaType = 'Sticker';

        const now = new Date().toLocaleString();

        // ─── SEND RESULT ───
        await reply(
            style.box('TOURL', [
                `${t(from, 'tourl_media_type')}: ${mediaType}`,
                `${t(from, 'tourl_size')}: ${formatBytes(mediaBuffer.length)}`,
                `${t(from, 'tourl_time')}: ${now}`,
                '',
                `🔗 ${t(from, 'tourl_url')}:`,
                `${mediaUrl}`
            ])
        );

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });

    } catch (error) {
        console.error('TOURL ERROR:', error.message);

        if (tempFilePath && fs.existsSync(tempFilePath)) {
            try { fs.unlinkSync(tempFilePath); } catch {}
        }

        return reply(style.error(t(from, 'tourl_error') + ': ' + (error.message || 'Unknown error')));
    }
});
