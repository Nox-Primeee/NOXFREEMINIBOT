// ════════════════════════════════════════════════════════════
// 📁 IMAGES - Liste des images du bot, une différente à chaque appel
// ════════════════════════════════════════════════════════════
const botImages = [
    'https://files.catbox.moe/bd42gd.jpg',
    'https://files.catbox.moe/6y3mqj.jpg',
    'https://files.catbox.moe/5won8f.jpg',
    'https://files.catbox.moe/csigr9.jpg',
];

function randomImage() {
    return botImages[Math.floor(Math.random() * botImages.length)];
}

module.exports = { botImages, randomImage };
