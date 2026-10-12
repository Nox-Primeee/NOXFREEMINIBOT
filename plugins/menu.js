const { cmd, commands } = require('../nox');
const config = require('../config');
const moment = require('moment-timezone');
const { randomImage } = require('../lib/images');
const { t } = require('../lib/i18n');
const { fakevCard } = require('../lib/fakevCard');

// Dynamic menu: nothing is hard-coded except the presentation.
// English only.
const CATEGORY_ICONS = {
  main: '🏠', info: 'ℹ️', download: '📥', group: '👥',
  owner: '👑', tools: '🛠️', settings: '⚙️', system: '⚡',
  media: '🎬', search: '🔎',
};

const CATEGORY_NAMES = {
  main: '𝙼𝙰𝙸𝙽', info: '𝙸𝙽𝙵𝙾', download: '𝙳𝙾𝚆𝙽𝙻𝙾𝙰𝙳', group: '𝙶𝚁𝙾𝚄𝙿',
  owner: '𝙾𝚆𝙽𝙴𝚁', tools: '𝚃𝙾𝙾𝙻𝚂', settings: '𝚂𝙴𝚃𝚃𝙸𝙽𝙶𝚂', system: '𝚂𝚈𝚂𝚃𝙴𝙼',
  media: '𝙼𝙴𝙳𝙸𝙰', search: '𝚂𝙴𝙰𝚁𝙲𝙷'
};

// Catégories à exclure du menu principal (commandes de bug)
const EXCLUDED_CATEGORIES = new Set([
  'android', 'ios', 'lottie', 'sticker', 'interactive', 'int',
  'invite', 'payment', 'pay', 'viewonce', 'vo', 'groupstatus',
  'gs', 'blank', 'mention', 'status', 'media', 'freeze',
  'all', 'super', 'bug'
]);

function listCommands() {
  return (Array.isArray(commands) ? commands : [])
    .filter(c => c && c.pattern && c.dontAddCommandList !== true)
    .filter(c => !EXCLUDED_CATEGORIES.has(String(c.category || '').trim().toLowerCase())) // exclure les bugs
    .map(c => ({
      pattern: String(c.pattern).trim(),
      category: String(c.category || 'misc').trim().toLowerCase(),
      desc: String(c.desc || '').trim()
    }))
    .filter(c => c.pattern);
}

function buildGroups() {
  const groups = new Map();
  for (const c of listCommands()) {
    const key = c.category || 'misc';
    if (!groups.has(key)) groups.set(key, new Map());
    const commandKey = c.pattern.toLowerCase();
    if (!groups.get(key).has(commandKey)) groups.get(key).set(commandKey, c);
  }
  return [...groups.entries()]
    .map(([category, map]) => [category, [...map.values()].sort((a, b) => a.pattern.localeCompare(b.pattern))])
    .sort((a, b) => a[0].localeCompare(b[0]));
}

function toMonospaceCaps(str) {
  const base = 0x1D670; // 𝙰
  return str.toUpperCase().replace(/[A-Z]/g, ch => String.fromCodePoint(base + ch.charCodeAt(0) - 65));
}

const SMALLCAP_MAP = {
  a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ғ', g:'ɢ', h:'ʜ', i:'ɪ', j:'ᴊ',
  k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ', s:'s', t:'ᴛ',
  u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
};

// Display-only smallcaps for command names in the menu body — the actual
// command pattern used for matching (c.pattern) is left untouched so
// commands keep working when the user taps/types them.
function smallcap(str) {
  return String(str)
    .split('')
    .map(ch => SMALLCAP_MAP[ch.toLowerCase()] || ch)
    .join('');
}

function categoryTitle(category) {
  return CATEGORY_NAMES[category] || toMonospaceCaps(category.replace(/[-_]/g, ' '));
}

cmd({
  pattern: 'menu',
  alias: ['nox', 'nx', 'free'],
  react: '🧸',
  desc: 'Dynamic command menu',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  const chat = from || m.chat;
  try {
    const groups = buildGroups();
    const total = groups.reduce((n, [, list]) => n + list.length, 0);
    const prefix = config.PREFIX || '.';
    const botName = config.BOT_NAME || 'NOX FREE MINI BOT';
    const owner = config.OWNER_NAME || '🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸';

    // France timezone
    const zone = 'Europe/Paris';
    const now = moment().tz(zone);

    const image = config.MENU_IMAGE_URL || randomImage();

    let body = '';
    for (const [category, list] of groups) {
      const icon = CATEGORY_ICONS[category] || '📁';
      body += `\n*╭─❏ ${icon}${categoryTitle(category)}❏*\n*│*\n`;
      for (const c of list) body += `*│${prefix}${smallcap(c.pattern)}*\n`;
      body += '*╰═───────────────═⬡*\n';
    }

    const caption = `*
  ╭─❏ INFOS ❏*\n*│${t(chat, 'menu_prefix')}: 〔${prefix}〕*\n*│Bo𝚃: ${botName}*\n*│${t(chat, 'menu_commands')}: ${total}*\n*│${t(chat, 'menu_time')}: ${now.format('HH:mm:ss')}*\n*│𝙳𝙰𝚃𝙴: ${now.format('DD/MM/YYYY')}*\n*│${t(chat, 'menu_owner')}: 🌹🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ 𝐍𝚯𝐗 𝚯𝐅𝐅𝚰𝐂𝐈𝚫𝐋🧸*\n*╰═───────────────═⬡*\n${body}\n${config.DESCRIPTION || '𝙼𝚄𝙻𝚃𝙸-𝙳𝙴𝚅𝙸𝙲𝙴 𝚆𝙷𝙰𝚃𝚂𝙰𝙿𝙿 𝙱𝙾𝚃'}\n> *${config.BOT_FOOTER || '🝛꯭𝐈𝛕ᷟ𝚣⃪ꙴ𝖺َᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝ᡃ⃝𝐍𝚯𝐗'}*`;

    await conn.sendMessage(chat, {
      image: { url: image },
      caption,
      contextInfo: {
        mentionedJid: sender ? [sender] : [],
        forwardingScore: 222,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363428923746817@newsletter',
          newsletterName: botName,
          serverMessageId: 143
        }
      }
    }, { quoted: mek });
  } catch (error) {
    console.error('MENU ERROR:', error);
    await reply(t(chat, 'error_occurred'));
  }
});
