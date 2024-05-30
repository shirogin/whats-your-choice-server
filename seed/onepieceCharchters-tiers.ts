import { readFile, writeFile } from 'fs/promises';
console.log('first');

readFile('data/onepiece1.json', 'utf-8')
	.then((data) => JSON.parse(data) as string[])
	.then((data) => {
		const baseUrl = data[0];
		const cards = data.slice(1);
		const cardsCollection: CardsJSON = {
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
		writeFile('cards/onpiece.json', JSON.stringify(d, null, 2), 'utf-8');
	})
	.catch((error) => console.error(error));
