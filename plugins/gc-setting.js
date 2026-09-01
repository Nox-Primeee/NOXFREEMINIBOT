const { t } = require('../lib/i18n');
const { sleep } = require('../lib/functions');
const config = require('../config');
const { cmd } = require("../sidd");
const { fakevCard } = require('../lib/fakevCard');
const style = require('../lib/style');

// Command to list all pending group join requests

cmd({
    pattern: "requestlist",
    desc: "Shows pending group join requests",
    category: "group",
    react: "📋",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isAdmins, isBotAdmins, reply }) => {
    try {
        await conn.sendMessage(from, { react: { text: '⏳', key: m.key } });

        if (!isGroup) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(style.error(t(from, 'groups_only')));
        }
        if (!isAdmins) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(style.error(t(from, 'admin_only')));
        }
        if (!isBotAdmins) {
            await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
            return reply(style.error(t(from, 'bot_must_be_admin')));
        }

        const requests = await conn.groupRequestParticipantsList(from);

        if (requests.length === 0) {
            await conn.sendMessage(from, { react: { text: 'ℹ️', key: m.key } });
            return reply(style.info('NO PENDING JOIN REQUESTS.'));
        }

        let lines = requests.map((user, i) => `${i + 1}. @${user.jid.split('@')[0]}`);
        let text = style.box(`PENDING REQUESTS (${requests.length})`, lines);

        await conn.sendMessage(from, { react: { text: '✅', key: m.key } });
        return reply(text, { mentions: requests.map(u => u.jid) });
    } catch (error) {
        console.error("REQUESTLIST ERROR:", error);
        await conn.sendMessage(from, { react: { text: '❌', key: m.key } });
        return reply(style.error('ERROR RETRIEVING REQUESTS.'));
    }
});

cmd({
    pattern: "kickall2",
    desc: "Remove all non-admin members",
    category: "group",
    react: "⚠️",
    filename: __filename
},
async (Void, citel) => {
    try {

        if (!citel.isGroup)
            return citel.reply(style.error(t(citel.chat, 'groups_only')));

        const metadata = await Void.groupMetadata(citel.chat);
        const participants = metadata.participants;

        const admins = participants
            .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
            .map(p => p.id);

        if (!admins.includes(citel.sender))
            return citel.reply(style.error(t(citel.chat, 'admin_only')));

        let botJid = Void.user.id.includes(':')
            ? Void.user.id.split(':')[0] + "@s.whatsapp.net"
            : Void.user.id;

        const toKick = participants
            .map(p => p.id)
            .filter(id => !admins.includes(id) && id !== botJid);

        await citel.reply(style.warning(`REMOVING ${toKick.length} MEMBERS...`));

        for (let user of toKick) {
            await Void.groupParticipantsUpdate(citel.chat, [user], "remove");
        }

        await citel.reply(style.success('REMOVAL COMPLETED!'));

    } catch (err) {
        console.log(err);
        citel.reply(style.error('FAILED TO REMOVE MEMBERS.'));
    }
});

cmd({
    pattern: "tagall2",
    desc: "Tag all members",
    category: "group",
    react: "🔊",
    filename: __filename
}, async (conn, mek, m, { from, participants, reply, isGroup, body, command }) => {
    try {
        if (!isGroup) return reply(style.error(t(from, 'groups_only')));

        let message = body.slice(body.indexOf(command) + command.length).trim();
        if (!message) message = "𝙰𝚃𝚃𝙴𝙽𝚃𝙸𝙾𝙽 𝙴𝚅𝙴𝚁𝚈𝙾𝙽𝙴!";

        let lines = participants.map((member, i) => `> *│${i + 1}. @${member.id.split('@')[0]}*`);
        let text = style.box('𝚃𝙰𝙶 𝙰𝙻𝙻', [`𝙼𝙴𝚂𝚂𝙰𝙶𝙴: ${message}`, ...lines, `> *𝚃𝙾𝚃𝙰𝙻: ${participants.length} 𝙼𝙴𝙼𝙱𝙴𝚁𝚂*`]);

        await conn.sendMessage(from, {
            text: text,
            mentions: participants.map(p => p.id)
        }, { quoted: fakevCard });

    } catch (err) {
        console.error("TAGALL2 ERROR:", err);
        reply(style.error(`TAGALL ERROR: ${err.message}`));
    }
});

cmd({
    pattern: "admincheck",
    desc: "Check admin status",
    category: "group",
    react: "🔍",
    filename: __filename
}, async (conn, mek, m, { from, isGroup, reply, sender, isCreator }) => {
    try {
        if (!isGroup) return reply(style.error(t(from, 'groups_only')));

        let lines = [
            `YOU: @${sender.split('@')[0]}`,
            `BOT OWNER: ${isCreator ? '✅ YES' : '❌ NO'}`
        ];

        try {
            const groupMetadata = await conn.groupMetadata(from);
            const botNumber = conn.user.id.split(':')[0].split('@')[0];
            const botParticipant = groupMetadata.participants.find(p => p.id.split('@')[0] === botNumber);
            const isBotAdmin = botParticipant ? botParticipant.admin : false;

            lines.push(`BOT ADMIN: ${isBotAdmin ? '✅ YES' : '❌ NO'}`);
            lines.push(`TOTAL MEMBERS: ${groupMetadata.participants.length}`);

            if (!isBotAdmin) {
                lines.push('THE BOT IS NOT ADMIN! USE: .botadmin OR PROMOTE MANUALLY.');
            } else {
                lines.push('THE BOT IS ADMIN! YOU CAN USE: .promote @user / .demote @admin / .kick @user / .add @user');
            }
        } catch (metadataError) {
            lines.push('UNABLE TO RETRIEVE GROUP INFO.');
            lines.push('THE BOT NEEDS ADMIN RIGHTS TO VERIFY. PROMOTE THE BOT FIRST WITH: .botadmin');
        }

        await conn.sendMessage(from, {
            text: style.box('ADMIN CHECK', lines),
            mentions: [sender]
        }, { quoted: mek });

    } catch (err) {
        console.error("ADMINCHECK ERROR:", err);
        reply(style.error(`ADMIN CHECK ERROR: ${err.message}`));
    }
});

cmd({
    pattern: "end",
    desc: "Removes all members (including admins) from the group except specified numbers",
    category: "group",
    react: "⚠️",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isBotAdmins, reply, groupMetadata, isCreator }) => {
    if (!isGroup) return reply(style.error(t(from, 'groups_only')));
    if (!isCreator) return reply(style.error(t(from, 'owner_only')));
    if (!isBotAdmins) return reply(style.error(t(from, 'bot_must_be_admin')));

    try {
        const ignoreJids = [
            "923237045919@s.whatsapp.net",
            "923237045919@s.whatsapp.net"
        ];

        const participants = groupMetadata.participants || [];

        const targets = participants.filter(p => !ignoreJids.includes(p.id));
        const jids = targets.map(p => p.id);

        if (jids.length === 0) return reply(style.success('NO MEMBER TO REMOVE (ALL EXCLUDED).'));

        await conn.groupParticipantsUpdate(from, jids, "remove");

        reply(style.success(`${jids.length} MEMBERS HAVE BEEN REMOVED FROM THE GROUP.`));
    } catch (error) {
        console.error("END COMMAND ERROR:", error);
        reply(style.error(`OPERATION FAILED: ${error.message}`));
    }
});
