const { getAntideleteStatus } = require('../data/Antidelete');
const config = require('../config');

const handleAntidelete = async (conn, updates, store) => {
    try {
        for (const update of updates) {
            if (update.key.fromMe) continue;

            // FIX: also treat `update.message === null` as a delete signal.
            // Baileys emits messages.update with the message content nulled
            // out on a revoke — relying only on messageStubType/protocolMessage
            // missed that shape and let some deletes slip through undetected.
            const isRevoke = update.update.messageStubType === 68 ||
                             (update.update.message &&
                              update.update.message.protocolMessage &&
                              update.update.message.protocolMessage.type === 0) ||
                             update.update.message === null;

            if (!isRevoke) continue;

            const chatId = update.key.remoteJid;
            const messageId = update.key.id;
            const participant = update.key.participant || chatId;

            // FIX: these guards used to `return`, which aborted the whole
            // batch the moment ONE update didn't qualify (e.g. antidelete
            // off for that chat) — any later update in the same batch for a
            // chat that DOES have it enabled was silently skipped. `continue`
            // only skips this one update.
            const isEnabled = await getAntideleteStatus(chatId);
            if (!isEnabled) continue;

            if (!store || !store.messages[chatId]) continue;
            const msg = await store.loadMessage(chatId, messageId);

            if (msg) {
                const alertText = `
🚫 *ANTI-DELETE DETECTED* 🚫
👤 *User:* @${participant.split('@')[0]}
📅 *Date:* ${new Date().toLocaleString()}
> ${config.BOT_FOOTER}
`;
                
                const inboxJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
                try {
                    await conn.sendMessage(inboxJid, { text: alertText, mentions: [participant] });
                    await conn.sendMessage(inboxJid, { forward: msg, contextInfo: { isForwarded: false } }, { quoted: msg });
                } catch (e) { console.error("Antidelete send error:", e); }
            }
        }
    } catch (e) { console.error("Antidelete Error:", e); }
};

module.exports = { handleAntidelete };
