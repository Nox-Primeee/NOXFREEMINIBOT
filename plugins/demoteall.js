const { cmd } = require('../sidd');
const { t } = require('../lib/i18n');
const style = require('../lib/style');

cmd({
    pattern: "demoteall",
    desc: "Demote all group admins (owner only)",
    category: "group",
    filename: __filename
},
async (conn, mek, m, { from, isGroup, isOwner, sender, reply }) => {
    try {
        if (!isGroup) return reply(style.error(t(from, 'groups_only')));
        if (!isOwner) return reply(style.error(t(from, 'owner_only')));

        const groupData = await conn.groupMetadata(from);
        const botId = conn.user.id.split(':')[0] + '@s.whatsapp.net';

        const admins = groupData.participants
            .filter(p => p.admin !== null)
            .map(p => p.id)
            .filter(id => id !== botId && id !== sender);

        if (admins.length === 0) return reply(style.error(t(from, 'demote_no_admins')));

        await conn.groupParticipantsUpdate(from, admins, "demote");
        return reply(style.success(t(from, 'demote_done')));
    } catch (error) {
        console.error("DEMOTEALL ERROR:", error);
        return reply(style.error(`${t(from, 'error_occurred')}: ${error.message}`));
    }
});
