import { readFile, writeFile } from 'fs/promises';

readFile('data/games.json', 'utf-8')
	.then((data) => JSON.parse(data) as string[])
	.then((data) => {
		const baseUrl = data[0];
		const cards = data.slice(1);
		const cardsCollection: CardsJSON = {
			id: 'greatest-videogames-of-all-time',
			name: 'Greatest Video Games of All Time',
			image: `${baseUrl}220px-bioshockcoverjpg.png`,
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
		writeFile('cards/games.json', JSON.stringify(d, null, 2), 'utf-8');
	})
	.catch((error) => console.error(error))
	.finally(() => console.log('loading game json done'));
