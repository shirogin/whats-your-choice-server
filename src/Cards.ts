import { readFile } from 'fs/promises';
import { z } from 'zod';
import { MyZodType } from './tools/defaultZod';
/* 
declare interface CardEssential {
	id: string;
	name: string;
	image: string;
}
 */

const CardValidator = z.object<MyZodType<CardEssential>>({
	id: z.number(),
	name: z.string(),
	image: z.string(),
});
const CardsValidator = z.object<MyZodType<CardsJSON>>({
	id: z.string(),
	name: z.string(),
	cards: z.array(CardValidator),
});

export class CardsCollection implements CardsJSON {
	cards: CardEssential[];
	name: string;
	id: string;
	constructor(id: string, name: string, cards: CardEssential[]) {
		this.id = id;
		this.name = name;
		this.cards = cards;
	}
	static async loadCardsFromJson(fileName: string): Promise<CardsCollection> {
		const cardsJson = await readFile(fileName, 'utf-8');
		const cards = CardsValidator.parse(JSON.parse(cardsJson)); // catch an error that is instanceof z.ZodError
		console.log(`cards collection ${cards.name} loaded with ${cards.cards.length} cards`);
		return new CardsCollection(cards.id, cards.name, cards.cards);
	}
	getRandomN(n: number): CardsCollection {
		const randomCards: CardEssential[] = [];
		for (let i = 0; i < n; i++) {
			const randomIndex = Math.floor(Math.random() * this.cards.length);
			if (randomCards.includes(this.cards[randomIndex])) i--;
			else randomCards.push(this.cards[randomIndex]);
		}
		return new CardsCollection(this.id, this.name, randomCards);
	}
}
