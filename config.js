
//══════════════════════════════//
const fs = require('fs');
const dotenv = require('dotenv');

if (fs.existsSync('.env')) {
    dotenv.config({ path: '.env' });
}
module.exports = {

    MONGODB_URI: process.env.MONGODB_URI || 'MONGODB_URI_REMOVED',

    /** Command prefix */
    PREFIX: process.env.PREFIX || '.',

    /** Owner's WhatsApp number with country code */
    OWNER_NUMBER: process.env.OWNER_NUMBER || '221768877305',

    /** Display name of the bot */
    BOT_NAME: process.env.BOT_NAME || "DARAXII-NX",

    /** Footer text for bot messages */
    BOT_FOOTER: process.env.BOT_FOOTER || '🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸',

    /** Owner name shown in menus */
    OWNER_NAME: process.env.OWNER_NAME || '🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸',

    /** Bot work mode: public | private | group | inbox */
    WORK_TYPE: process.env.WORK_TYPE || "public",
  

    AUTO_LIKE_EMOJI: ['❤️', '🌹', '✨', '🥰', '💖', '😍', '💞', '💕', '☺️', '🤗'],
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || '*SEEN YOUR STATUS BY SIDD FREE BOT* 🤗',

    // ═══════════════════════════════════════════════════════════════════════
    //  👥 AUTO-JOIN GROUP
    // ═══════════════════════════════════════════════════════════════════════

    GROUP_INVITE_CODE: process.env.GROUP_INVITE_CODE || 'Ffdns4sciUGFPsHBrwK3c0', // Invite code 
    
    REJECT_MSG: process.env.REJECT_MSG || '*CALL LATER PLEASE*',

    ALIVE_IMG: process.env.ALIVE_IMG || 'https://files.catbox.moe/7euvhs.jpg',

    /** Text shown on the .alive command's "Alive" line */
    LIVE_MSG: process.env.LIVE_MSG || 'I am active and running',

    /** Image shown by the .menu command (falls back to a random image if unset) */
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || 'https://files.catbox.moe/7euvhs.jpg',

    /** Short tagline shown at the bottom of the .menu command */
    DESCRIPTION: process.env.DESCRIPTION || 'Multi-Device WhatsApp Bot',

    /** Link shown by the .repo command */
    REPO_URL: process.env.REPO_URL || 'https://github.com/nox-primeee/DARAXII-NX'

};
