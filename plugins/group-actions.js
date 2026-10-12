const { cmd } = require('../nox');
const config = require('../config');
const { t } = require('../lib/i18n');
const style = require('../lib/style');
const fs = require('fs');
const path = require('path');

// ─────────────────────────────────────────────
// FONCTIONS UTILITAIRES
// ─────────────────────────────────────────────

function getBotJid(conn) {
    return conn.user.id.split(':')[0] + '@s.whatsapp.net';
}

async function isBotGroupAdmin(conn, from) {
    try {
        const metadata = await conn.groupMetadata(from);
        const botJid = getBotJid(conn);
        const botParticipant = metadata.participants.find(p => p.id === botJid);
        return !!(botParticipant && botParticipant.admin);
    } catch {
        return false;
    }
}

// ─────────────────────────────────────────────
// GESTION DES FICHIERS DE CONFIGURATION
// ─────────────────────────────────────────────

// Fichiers distincts pour éviter les conflits
const DATA_FILE_TIMES = path.join(__dirname, '../data/group_times.json');
const DATA_FILE_TIMEOUT = path.join(__dirname, '../data/group_timeout.json');

// Charge / sauvegarde pour group_times
function loadTimeData() {
    try {
        if (fs.existsSync(DATA_FILE_TIMES)) {
            const data = fs.readFileSync(DATA_FILE_TIMES, 'utf8');
            return JSON.parse(data);
        }
        return {};
    } catch (error) {
        console.error('LOAD TIME DATA ERROR:', error);
        return {};
    }
}

function saveTimeData(data) {
    try {
        const dir = path.dirname(DATA_FILE_TIMES);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE_TIMES, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('SAVE TIME DATA ERROR:', error);
        return false;
    }
}

function getGroupTime(groupId) {
    const data = loadTimeData();
    return data[groupId] || null;
}

function setGroupTime(groupId, timeData) {
    const data = loadTimeData();
    data[groupId] = timeData;
    return saveTimeData(data);
}

function removeGroupTime(groupId) {
    const data = loadTimeData();
    delete data[groupId];
    return saveTimeData(data);
}

// ─────────────────────────────────────────────
// PARSEUR DE TEMPS (HH:MM)
// ─────────────────────────────────────────────

function parseTime(timeStr) {
    const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return { hours, minutes };
}

function getCurrentTime() {
    const now = new Date();
    return { hours: now.getHours(), minutes: now.getMinutes() };
}

function isTimeBetween(current, start, end) {
    const currentMinutes = current.hours * 60 + current.minutes;
    const startMinutes = start.hours * 60 + start.minutes;
    const endMinutes = end.hours * 60 + end.minutes;
    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
}

function timeToStr(time) {
    const pad = n => String(n).padStart(2, '0');
    return `${pad(time.hours)}:${pad(time.minutes)}`;
}

// ─────────────────────────────────────────────
// PARSEUR DE DURÉE (pour les timeouts)
// ─────────────────────────────────────────────

function parseDuration(args) {
    if (!args || args.length === 0) return null;
    const input = args.join(' ').toLowerCase().trim();
    const match = input.match(/^(\d+)\s*(s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours)?$/);
    if (!match) return null;
    const value = parseInt(match[1]);
    const unit = match[2] || 's';
    if (isNaN(value) || value <= 0) return null;
    let milliseconds = 0;
    switch (unit) {
        case 's': case 'sec': case 'second': case 'seconds':
            milliseconds = value * 1000; break;
        case 'm': case 'min': case 'minute': case 'minutes':
            milliseconds = value * 60 * 1000; break;
        case 'h': case 'hr': case 'hour': case 'hours':
            milliseconds = value * 60 * 60 * 1000; break;
        default: return null;
    }
    return {
        value,
        unit,
        milliseconds,
        display: `${value} ${unit}${value > 1 ? (unit === 's' ? '' : 's') : ''}`
    };
}

function formatTimeLeft(ms) {
    if (ms <= 0) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;
    const remainingHours = hours % 24;
    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (remainingHours > 0) parts.push(`${remainingHours}h`);
    if (remainingMinutes > 0) parts.push(`${remainingMinutes}m`);
    if (remainingSeconds > 0) parts.push(`${remainingSeconds}s`);
    return parts.join(' ') || '0s';
}

// ─────────────────────────────────────────────
// COMMANDES
// ─────────────────────────────────────────────

// ─── KICKNUM ──────────────────────────────────
cmd({
    pattern: "kicknum",
    desc: "Remove a member by phone number",
    category: "group",
    react: "🔢",
    use: ".kicknum <number>",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, isOwner, reply }) => {
    try {
        if (!isGroup) return reply(style.box('KICKNUM', `❌ ${t(from, 'groups_only')}`));
        if (!isAdmins && !isOwner) return reply(style.box('KICKNUM', `❌ ${t(from, 'admin_only')}`));
        if (!(await isBotGroupAdmin(conn, from))) return reply(style.box('KICKNUM', `❌ ${t(from, 'bot_must_be_admin') || 'Le bot doit être admin.'}`));

        const rawNumber = args[0];
        if (!rawNumber) return reply(style.box('KICKNUM', `❌ ${t(from, 'no_target')}`, 'use: .kicknum <number>'));

        const cleanNumber = rawNumber.replace(/[^0-9]/g, '');
        if (cleanNumber.length < 8) return reply(style.box('KICKNUM', `❌ ${t(from, 'invalid_number') || 'Numéro invalide.'}`));

        const targetJid = `${cleanNumber}@s.whatsapp.net`;
        await conn.groupParticipantsUpdate(from, [targetJid], 'remove');

        return reply(style.box('KICKNUM', `✅ *${cleanNumber}* ${t(from, 'kicked') || 'expulsé.'}`));

    } catch (error) {
        console.error('KICKNUM ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── ACCEPTALL ────────────────────────────────
cmd({
    pattern: "acceptall",
    desc: "Accept all pending group join requests",
    category: "group",
    react: "✅",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, reply }) => {
    try {
        if (!isGroup) return reply(style.box('ACCEPTALL', `❌ ${t(from, 'groups_only')}`));
        if (!isAdmins && !isOwner) return reply(style.box('ACCEPTALL', `❌ ${t(from, 'admin_only')}`));
        if (!(await isBotGroupAdmin(conn, from))) return reply(style.box('ACCEPTALL', `❌ ${t(from, 'bot_must_be_admin') || 'Le bot doit être admin.'}`));

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests.length) return reply(style.box('ACCEPTALL', t(from, 'no_pending_requests') || 'Aucune demande en attente.'));

        const jids = requests.map(r => r.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, 'approve');

        return reply(style.box('ACCEPTALL', `✅ ${jids.length} ${t(from, 'requests_accepted') || 'demande(s) acceptée(s).'}`));

    } catch (error) {
        console.error('ACCEPTALL ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── REJECTALL ────────────────────────────────
cmd({
    pattern: "rejectall",
    desc: "Reject all pending group join requests",
    category: "group",
    react: "❌",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, reply }) => {
    try {
        if (!isGroup) return reply(style.box('REJECTALL', `❌ ${t(from, 'groups_only')}`));
        if (!isAdmins && !isOwner) return reply(style.box('REJECTALL', `❌ ${t(from, 'admin_only')}`));
        if (!(await isBotGroupAdmin(conn, from))) return reply(style.box('REJECTALL', `❌ ${t(from, 'bot_must_be_admin') || 'Le bot doit être admin.'}`));

        const requests = await conn.groupRequestParticipantsList(from);
        if (!requests.length) return reply(style.box('REJECTALL', t(from, 'no_pending_requests') || 'Aucune demande en attente.'));

        const jids = requests.map(r => r.jid);
        await conn.groupRequestParticipantsUpdate(from, jids, 'reject');

        return reply(style.box('REJECTALL', `✅ ${jids.length} ${t(from, 'requests_rejected') || 'demande(s) rejetée(s).'}`));

    } catch (error) {
        console.error('REJECTALL ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── KICKADMIN ─────────────────────────────────
cmd({
    pattern: "kickadmin",
    desc: "Demote then remove an admin from the group (owner only)",
    category: "group",
    react: "⚠️",
    use: "Reply to or mention the admin to remove",
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isOwner, reply, mentionedJid }) => {
    try {
        if (!isGroup) return reply(style.box('KICKADMIN', `❌ ${t(from, 'groups_only')}`));
        if (!isOwner) return reply(style.box('KICKADMIN', `❌ ${t(from, 'owner_only')}`));
        if (!(await isBotGroupAdmin(conn, from))) return reply(style.box('KICKADMIN', `❌ ${t(from, 'bot_must_be_admin') || 'Le bot doit être admin.'}`));

        const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
        const target = (mentionedJid && mentionedJid[0]) || quotedParticipant ||
            (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);

        if (!target) return reply(style.box('KICKADMIN', `❌ ${t(from, 'no_target')}`, 'use: reply/mention the admin'));

        await conn.groupParticipantsUpdate(from, [target], 'demote');
        await conn.groupParticipantsUpdate(from, [target], 'remove');

        return reply(style.box('KICKADMIN', `✅ @${target.split('@')[0]} ${t(from, 'kicked') || 'expulsé.'}`));

    } catch (error) {
        console.error('KICKADMIN ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── UNLOCK ────────────────────────────────────
cmd({
    pattern: "unlock",
    desc: "Unlock the group so everyone can send messages",
    category: "group",
    react: "🔓",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, reply }) => {
    try {
        if (!isGroup) return reply(style.box('UNLOCK', `❌ ${t(from, 'groups_only')}`));
        if (!isAdmins && !isOwner) return reply(style.box('UNLOCK', `❌ ${t(from, 'admin_only')}`));
        if (!(await isBotGroupAdmin(conn, from))) return reply(style.box('UNLOCK', `❌ ${t(from, 'bot_must_be_admin') || 'Le bot doit être admin.'}`));

        await conn.groupSettingUpdate(from, 'not_announcement');
        return reply(style.box('UNLOCK', `🔓 ${t(from, 'opened') || 'Groupe déverrouillé.'}`));

    } catch (error) {
        console.error('UNLOCK ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── BLOCK ─────────────────────────────────────
cmd({
    pattern: "block",
    desc: "Block a user (reply to their message or give their number)",
    category: "group",
    react: "🚫",
    use: ".block <number> (or reply to their message)",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply, mentionedJid }) => {
    try {
        if (!isOwner) return reply(style.box('BLOCK', `❌ ${t(from, 'owner_only')}`));

        const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
        const target = (mentionedJid && mentionedJid[0]) || quotedParticipant ||
            (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);

        if (!target) return reply(style.box('BLOCK', `❌ ${t(from, 'no_target')}`, 'use: .block <number>'));

        await conn.updateBlockStatus(target, 'block');
        return reply(style.box('BLOCK', `🚫 @${target.split('@')[0]} ${t(from, 'blocked') || 'bloqué.'}`));

    } catch (error) {
        console.error('BLOCK ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── UNBLOCK ───────────────────────────────────
cmd({
    pattern: "unblock",
    desc: "Unblock a user by number",
    category: "group",
    react: "✅",
    use: ".unblock <number>",
    filename: __filename
}, async (conn, mek, m, { from, args, isOwner, reply, mentionedJid }) => {
    try {
        if (!isOwner) return reply(style.box('UNBLOCK', `❌ ${t(from, 'owner_only')}`));

        const target = (mentionedJid && mentionedJid[0]) ||
            (args[0] ? `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net` : null);

        if (!target) return reply(style.box('UNBLOCK', `❌ ${t(from, 'no_target')}`, 'use: .unblock <number>'));

        await conn.updateBlockStatus(target, 'unblock');
        return reply(style.box('UNBLOCK', `✅ @${target.split('@')[0]} ${t(from, 'unblocked') || 'débloqué.'}`));

    } catch (error) {
        console.error('UNBLOCK ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── LEFT ──────────────────────────────────────
cmd({
    pattern: "left",
    alias: ["leave", "leavegroup"],
    desc: "Make the bot leave the group",
    category: "group",
    react: "🚪",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isOwner, reply }) => {
    try {
        if (!isGroup) return reply(style.box('LEFT', `❌ ${t(from, 'groups_only')}`));
        if (!isOwner) return reply(style.box('LEFT', `❌ ${t(from, 'owner_only')}`));

        await reply(style.box('LEFT', `👋 ${t(from, 'leaving_group') || 'Le bot quitte le groupe...'}`));
        await conn.groupLeave(from);

    } catch (error) {
        console.error('LEFT ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});

// ─── VCF ──────────────────────────────────────
cmd({
    pattern: "vcf",
    alias: ["exportcontacts"],
    desc: "Export all group members as a .vcf contact file",
    category: "group",
    react: "📇",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, isAdmins, isOwner, reply }) => {
    try {
        if (!isGroup) return reply(style.box('VCF', `❌ ${t(from, 'groups_only')}`));
        if (!isAdmins && !isOwner) return reply(style.box('VCF', `❌ ${t(from, 'admin_only')}`));

        const metadata = await conn.groupMetadata(from);
        const participants = metadata.participants;

        let vcfContent = '';
        participants.forEach((p, i) => {
            const number = p.id.split('@')[0];
            vcfContent += `BEGIN:VCARD\nVERSION:3.0\nFN:Membre ${i + 1}\nTEL;type=CELL;waid=${number}:${number}\nEND:VCARD\n`;
        });

        const buffer = Buffer.from(vcfContent, 'utf-8');

        await conn.sendMessage(from, {
            document: buffer,
            mimetype: 'text/x-vcard',
            fileName: `${metadata.subject || 'group'}-contacts.vcf`,
            caption: `📇 ${participants.length} ${t(from, 'contacts_exported') || 'contact(s) exporté(s).'}`
        }, { quoted: mek });

    } catch (error) {
        console.error('VCF ERROR:', error);
        reply(style.error(t(from, 'error_occurred')));
    }
});
