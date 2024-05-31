"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CardsCollection = void 0;
const promises_1 = require("fs/promises");
const zod_1 = require("zod");
const CardValidator = zod_1.z.object({
    id: zod_1.z.number(),
    name: zod_1.z.string(),
    image: zod_1.z.string().url(),
});
const CardsValidator = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    image: zod_1.z.string().url(),
    cards: zod_1.z.array(CardValidator),
});
class CardsCollection {
    constructor(id, name, image, cards) {
        this.id = id;
        this.name = name;
        this.image = image;
        this.cards = cards;
    }
    static loadCardsFromJson(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const cardsJson = yield (0, promises_1.readFile)(fileName, 'utf-8');
            const cards = CardsValidator.parse(JSON.parse(cardsJson)); // catch an error that is instanceof z.ZodError
            console.log(`cards collection ${cards.name} loaded with ${cards.cards.length} cards`);
            const cardsCollection = new CardsCollection(cards.id, cards.name, cards.image, cards.cards);
            CardsCollection.cardCollectionMap.set(cards.id, cardsCollection);
            if (!CardsCollection.defaultCollection)
                CardsCollection.defaultCollection = cardsCollection;
            return {
                id: cardsCollection.id,
                name: cardsCollection.name,
                image: cardsCollection.image,
            };
        });
    }
    static getCardsCollection(id) {
        const cardsCollection = CardsCollection.cardCollectionMap.get(id);
        if (!cardsCollection)
            return null;
        return cardsCollection;
    }
    getRandomN(n) {
        const randomCards = [];
        for (let i = 0; i < n; i++) {
            const randomIndex = Math.floor(Math.random() * this.cards.length);
            if (randomCards.includes(this.cards[randomIndex]))
                i--;
            else
                randomCards.push(this.cards[randomIndex]);
        }
        return new CardsCollection(this.id, this.name, randomCards[0].image, randomCards);
    }
}
exports.CardsCollection = CardsCollection;
CardsCollection.cardCollectionMap = new Map();
//# sourceMappingURL=Cards.js.map