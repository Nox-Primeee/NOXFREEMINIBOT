const { cmd } = require('../sidd');
const { siddTechx } = require('../lib/style');
const { t } = require('../lib/i18n');

// ════════════════════════════════════════════════════════════
// 📁 antilinkGroups: Map<groupJid, boolean>
// antilinkWarnings: Map<"groupJid:senderJid", number>
const antilinkGroups = new Map();
const antilinkWarnings = new Map();

// Link detection patterns — social media + generic URLs
const linkPatterns = [
    /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
    /https?:\/\/(www\.)?whatsapp\.com\/channel\/\S+/gi,
    /wa\.me\/\S+/gi,
    /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
    /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
    /https?:\/\/youtu\.be\/\S+/gi,
    /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
    /https?:\/\/fb\.me\/\S+/gi,
    /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?x\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?discord\.gg\/\S+/gi,
    /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
    /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
    /https?:\/\/bit\.ly\/\S+/gi,
    /https?:\/\/tinyurl\.com\/\S+/gi,
    /https?:\/\/t\.co\/\S+/gi,
    /https?:\/\/\S+\.\S{2,6}(\/\S*)?/gi,   // catch-all generic URL
];

// =========== ANTILINK ON/OFF COMMAND ===========
cmd({
    pattern: "antilink",
    desc: "Enable/disable antilink (warn + delete first, remove on second offense)",
    category: "group",
    react: "🔗",
    use: ".antilink on/off",
    filename: __filename
},
async (conn, mek, m, { from, args, isGroup, isOwner, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup) return reply(siddTechx('ANTILINK', t(from, 'groups_only'), '❌'));
        if (!isOwner && !isAdmins) return reply(siddTechx('ANTILINK', t(from, 'admin_only'), '❌'));
        if (!isBotAdmins) return reply(siddTechx('ANTILINK', t(from, 'bot_must_be_admin'), '❌'));

        const action = (args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(action)) {
            return reply(siddTechx('ANTILINK', t(from, 'antilink_usage'), '❓'));
        }

        if (action === 'on') {
            antilinkGroups.set(from, true);
            reply(siddTechx('ANTILINK', t(from, 'activated'), '🟢'));
        } else {
            antilinkGroups.set(from, false);
            // Clear all warnings for this group
            for (const key of antilinkWarnings.keys()) {
                if (key.startsWith(from + ':')) antilinkWarnings.delete(key);
            }
            reply(siddTechx('ANTILINK', t(from, 'deactivated'), '🔴'));
        }

    } catch (e) {
        console.error('Antilink cmd error:', e);
        reply(siddTechx('ANTILINK', t(from, 'error_occurred'), '❌'));
    }
});

// =========== ANTILINK DETECTOR (on every message body) ===========
// 1st offense: warn + delete link
// 2nd offense: remove from group
cmd({
    on: "body"
},
async (conn, mek, m, { from, body, sender, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isGroup || isAdmins || !isBotAdmins) return;
        if (mek.key?.fromMe) return; // Never process bot's own messages for antilink

        // Check if antilink is enabled for this group
        if (!antilinkGroups.get(from)) return;

        // Reset regex lastIndex before testing (important for /g flags)
        const hasLink = linkPatterns.some(p => {
            p.lastIndex = 0;
            return p.test(body || '');
        });
        if (!hasLink) return;

        const warnKey = `${from}:${sender}`;
        const userWarnings = antilinkWarnings.get(warnKey) || 0;

        if (userWarnings === 0) {
            // ⚠️ FIRST OFFENSE: Warn + Delete message
            antilinkWarnings.set(warnKey, 1);

            try { await conn.sendMessage(from, { delete: mek.key }); } catch {}

            await conn.sendMessage(from, {
                text: t(from, 'antilink_warning', { user: sender.split('@')[0] }),
                mentions: [sender]
            }, { quoted: mek });

        } else {
            // 🚫 SECOND OFFENSE: Delete + Remove from group
            antilinkWarnings.delete(warnKey);

            try { await conn.sendMessage(from, { delete: mek.key }); } catch {}

            await conn.sendMessage(from, {
                text: `🚫 *removed!* @${sender.split('@')[0]}\n\n🔗 you ᴀᴠɪᴇᴢ was ᴀᴠᴇʀᴛɪ to ᴇɴᴠᴏɪ ᴅᴇ ʟɪᴇɴs.\n👮 you ᴀᴠᴇᴢ was removed the ɢʀorᴘᴇ.`,
                mentions: [sender]
            }, { quoted: mek });

            await conn.groupParticipantsUpdate(from, [sender], "remove");
        }

    } catch (e) {
        console.error('Antilink detect error:', e);
    }
});
