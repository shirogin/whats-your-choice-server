import { readFile, writeFile } from 'fs/promises';

readFile('data/berserk.json', 'utf-8')
	.then((data) => JSON.parse(data) as string[])
	.then((data) => {
		const baseUrl = data[0];
		const cards = data.slice(1);
		const cardsCollection: CardsJSON = {
			id: 'berserk',
			name: 'Berserk',
			image: `${baseUrl}gambinojpg.png`,
			cards: cards.map((card, index) => ({
				id: index,
				name: card
					.replace(/_|-/gi, ' ')
					.replace(/(^z+\s*\d+)|((png|jpg)?\.?png$)/gi, '')
					// capitlize the first letter
					.replace(/^./, (letter) => letter.toUpperCase()),
				image: `${baseUrl}${card}`,
			})),
		};
		return cardsCollection;
	})
	.then((d) => {
		writeFile('cards/berserk.json', JSON.stringify(d, null, 2), 'utf-8');
	})
	.catch((error) => console.error(error))
	.finally(() => console.log('loading berserk json done'));
