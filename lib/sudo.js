const sudoNumbers = new Set(); // numéros (sans @s.whatsapp.net), ex: "221768877305"

function isSudo(number) {
    return sudoNumbers.has(number);
}

function addSudo(number) {
    sudoNumbers.add(number);
}

function removeSudo(number) {
    return sudoNumbers.delete(number);
}

function listSudo() {
    return Array.from(sudoNumbers);
}

module.exports = { sudoNumbers, isSudo, addSudo, removeSudo, listSudo };
