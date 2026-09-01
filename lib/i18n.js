const fs = require('fs');
const path = require('path');

// ════════════════════════════════════════════════════════════
// 📁 I18N - ENGLISH ONLY
// The multilingual system has been permanently disabled.
// This module now always resolves to English (data/languages/en.js).
// The t()/getLanguage() function signatures are kept unchanged so
// every existing call site across the project keeps working as-is.
// ════════════════════════════════════════════════════════════

const LANG_DIR = path.join(__dirname, '..', 'data', 'languages');
const DEFAULT_LANG = 'en';

const languages = {};
try {
    languages[DEFAULT_LANG] = require(path.join(LANG_DIR, `${DEFAULT_LANG}.js`));
} catch (e) {
    console.error('❌ Failed to load English language file:', e.message);
    languages[DEFAULT_LANG] = {};
}

function getAvailableLanguages() {
    const l = languages[DEFAULT_LANG];
    return [{ code: l.code || 'en', name: l.name || 'English', flag: l.flag || '🇬🇧' }];
}

function isValidLanguage(code) {
    return code === DEFAULT_LANG;
}

// Multilingual selection is disabled: the bot is English-only.
function setLanguage() {
    return false;
}

function getLanguage() {
    return DEFAULT_LANG;
}

/**
 * Returns the English text for a given key, with {var} substitution.
 * @param {string} chatJid kept for backward compatibility, unused
 * @param {string} key
 * @param {object} vars
 */
function t(chatJid, key, vars = {}) {
    const pack = languages[DEFAULT_LANG];
    let text = (pack && pack[key]) ?? key;
    for (const [k, v] of Object.entries(vars)) {
        text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return text;
}

module.exports = { t, setLanguage, getLanguage, isValidLanguage, getAvailableLanguages, languages, DEFAULT_LANG };

