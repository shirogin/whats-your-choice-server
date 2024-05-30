"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
console.log('first');
(0, promises_1.readFile)('data/onepiece1.json', 'utf-8')
    .then((data) => JSON.parse(data))
    .then((data) => {
    const baseUrl = data[0];
    const cards = data.slice(1);
    const cardsCollection = {
        id: 'onepiece',
        name: 'One Piece',
        cards: cards.map((card, index) => ({
            id: index,
            name: card
                .replace(/_|-/gi, ' ')
                .replace(/(^z+\s*\d+)|((png)?\.?png$)/gi, '')
                // capitlize the first letter
                .replace(/^./, (letter) => letter.toUpperCase()),
            image: `${baseUrl}${card}`,
        })),
    };
    return cardsCollection;
})
    .then((d) => {
    (0, promises_1.writeFile)('cards/onpiece.json', JSON.stringify(d, null, 2), 'utf-8');
})
    .catch((error) => console.error(error));
//# sourceMappingURL=onepieceCharchters-tiers.js.map