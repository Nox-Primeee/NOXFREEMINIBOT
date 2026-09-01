const { cmd } = require('../sidd');
const { t } = require('../lib/i18n');
const config = require('../config');
const { randomImage } = require('../lib/images');
const style = require('../lib/style');

cmd({
    pattern: "getpp",
    desc: "Get a user profile picture",
    category: "tools",
    react: "✅",
    filename: __filename
},
async (conn, mek, m, { from, sender, reply, isGroup }) => {
    try {
        const quotedParticipant = mek.message?.extendedTextMessage?.contextInfo?.participant;
        const quotedMsg = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        let targetJid;

        if (isGroup) {
            if (quotedParticipant && quotedMsg) {
                targetJid = quotedParticipant;
            } else {
                return reply(style.error('REPLY TO A USER MESSAGE TO GET THEIR PROFILE PHOTO.'));
            }
        } else {
            targetJid = sender;
        }

        let imageUrl;
        try {
            imageUrl = await conn.profilePictureUrl(targetJid, 'image');
        } catch {
            imageUrl = randomImage();
        }

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption: style.box('PROFILE PICTURE', `USER: @${targetJid.split('@')[0]}`),
            mentions: [targetJid]
        }, { quoted: mek });

    } catch (err) {
        console.error("GETPP ERROR:", err);
        reply(style.error('UNABLE TO RETRIEVE THE PROFILE PHOTO.'));
    }
});
