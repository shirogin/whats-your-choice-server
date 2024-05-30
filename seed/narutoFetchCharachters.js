// load from curl -X 'GET' \ 'https://narutodb.xyz/api/character?page=1&limit=20' \ -H 'accept: application/json'

const { writeFile } = require('fs/promises');

const fetchCharacters = async (index) => {
	const response = await fetch(`https://narutodb.xyz/api/character?page=${index}&limit=20`);
	const data = await response.json();
	return data;
};
const charactersSize = 1431;
const toBeRemoved = [
	8, 105, 1, 18, 19, 20, 7, 4, 24, 26, 31, 44, 43, 105, 89, 266, 317, 420, 448, 513, 515, 526, 640, 697, 802, 790,
	845, 888, 855, 900, 911, 901, 1026, 1032, 1085, 1173, 1185, 1226, 1265, 1340, 1376,
];

const pagesSize = Math.ceil(charactersSize / 20);
Promise.all(
	Array.from({ length: pagesSize }, (_, i) => i + 1).map((index) =>
		fetchCharacters(index).then((data) =>
			data.characters
				.filter((character) => character.images.length > 0 && character.debut && character.debut['manga'])
				.map((character) => ({
					name: character.name,
					image: character.images[0],
					id: character.id,
				}))
				.filter((character) => character.name && character.id && !toBeRemoved.includes(character.id))
		)
	)
).then(async (characters) => {
	const charactersObj = characters.flat();
	console.log(charactersObj.length);
	await writeFile('characters.json', JSON.stringify(charactersObj));
});
