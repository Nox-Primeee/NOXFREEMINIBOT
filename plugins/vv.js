const { cmd } = require('../sidd');
const config = require('../config');
const { t } = require('../lib/i18n');
const style = require('../lib/style');

// ─────────────────────────────────────────────
// VV - Owner only - Forward quoted message to user
// ─────────────────────────────────────────────

cmd({
    pattern: 'vv',
    alias: ['sendme'],
    react: '👀',
    desc: 'Owner only - Forward quoted message to your DM',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        // ─── OWNER CHECK ───
        if (!isOwner) {
            return reply(style.box('VV', t(from, 'plugin_owner_only')));
        }

        // ─── CHECK QUOTED ───
        const quoted = m.quoted || mek.quoted;

        if (!quoted) {
            return reply(
                style.box('VV', [
                    '❌ ' + t(from, 'vv_no_quoted'),
                    '',
                    `📌 ${t(from, 'vv_usage', { prefix: config.PREFIX || '.' })}`
                ])
            );
        }

        // ─── DOWNLOAD MEDIA ───
        let mediaData;
        try {
            mediaData = await quoted.download();
        } catch (err) {
            console.error('VV DOWNLOAD ERROR:', err);
            return reply(style.error(t(from, 'vv_download_failed') + ': ' + err.message));
        }

        const messageType = quoted.mtype || 'textMessage';
        const senderJid = mek.sender || m.sender;

        // ─── PREPARE FORWARD DATA ───
        let forwardData = {};

        switch (messageType) {
            case 'imageMessage':
                forwardData = {
                    image: mediaData,
                    caption: quoted.text || '',
                    mimetype: quoted.mimetype || 'image/jpeg'
                };
                break;

            case 'videoMessage':
                forwardData = {
                    video: mediaData,
                    caption: quoted.text || '',
                    mimetype: quoted.mimetype || 'video/mp4'
                };
                break;

            case 'audioMessage':
                forwardData = {
                    audio: mediaData,
                    mimetype: 'audio/mp4',
                    ptt: quoted.ptt || false
                };
                break;

            case 'stickerMessage':
                forwardData = { sticker: mediaData };
                break;

            case 'documentMessage':
                forwardData = {
                    document: mediaData,
                    mimetype: quoted.mimetype || 'application/octet-stream',
                    fileName: quoted.fileName || 'document'
                };
                break;

            default:
                if (quoted.text || quoted.conversation) {
                    forwardData = { text: quoted.text || quoted.conversation };
                } else {
                    return reply(style.box('VV', ['❌ ' + t(from, 'vv_unsupported')]));
                }
        }

        // ─── SEND TO DM ───
        await conn.sendMessage(senderJid, forwardData, { quoted: mek });

        return reply(style.box('VV', ['✅ ' + t(from, 'vv_success')]));

    } catch (error) {
        console.error('VV ERROR:', error);
        return reply(style.error(t(from, 'plugin_error') + ': ' + error.message));
    }
});

// ─────────────────────────────────────────────
// TOVV - Owner only - Convert media to view-once
// ─────────────────────────────────────────────

cmd({
    pattern: 'tovv',
    alias: ['toviewonce'],
    react: '📥',
    desc: 'Owner only - Convert quoted media to view-once',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { from, reply, isOwner }) => {
    try {
        // ─── OWNER CHECK ───
        if (!isOwner) {
            return reply(style.box('TOVV', t(from, 'plugin_owner_only')));
        }

        // ─── CHECK QUOTED ───
        const quoted = m.quoted || mek.quoted;

        if (!quoted) {
            return reply(
                style.box('TOVV', [
                    '❌ ' + t(from, 'tovv_no_quoted'),
                    '',
                    `📌 ${t(from, 'tovv_usage', { prefix: config.PREFIX || '.' })}`
                ])
            );
        }

        // ─── DOWNLOAD MEDIA ───
        let mediaData;
        try {
            mediaData = await quoted.download();
        } catch (err) {
            console.error('TOVV DOWNLOAD ERROR:', err);
            return reply(style.error(t(from, 'tovv_download_failed') + ': ' + err.message));
        }

        const messageType = quoted.mtype || 'textMessage';
        const senderJid = mek.sender || m.sender;

        // ─── PREPARE VIEW-ONCE DATA ───
        let forwardData = {};

        switch (messageType) {
            case 'imageMessage':
                forwardData = {
                    image: mediaData,
                    caption: quoted.text || '',
                    mimetype: quoted.mimetype || 'image/jpeg',
                    viewOnce: true
                };
                break;

            case 'videoMessage':
                forwardData = {
                    video: mediaData,
                    caption: quoted.text || '',
                    mimetype: quoted.mimetype || 'video/mp4',
                    viewOnce: true
                };
                break;

            case 'audioMessage':
                forwardData = {
                    audio: mediaData,
                    mimetype: 'audio/mp4',
                    ptt: quoted.ptt || false,
                    viewOnce: true
                };
                break;

            default:
                return reply(style.box('TOVV', ['❌ ' + t(from, 'tovv_unsupported')]));
        }

        // ─── SEND TO DM ───
        await conn.sendMessage(senderJid, forwardData, { quoted: mek });

        return reply(style.box('TOVV', ['✅ ' + t(from, 'tovv_success')]));

    } catch (error) {
        console.error('TOVV ERROR:', error);
        return reply(style.error(t(from, 'plugin_error') + ': ' + error.message));
    }
});
