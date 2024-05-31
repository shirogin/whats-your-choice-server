import { SocketEvent } from './types/Event';
import { CardsCollection } from './Cards';
import { RoomsManager } from './Rooms';
import { PORT, io, server } from './app';

const cards = [
	CardsCollection.loadCardsFromJson('cards/naruto-cards.json'),
	CardsCollection.loadCardsFromJson('cards/onpiece.json'),
	CardsCollection.loadCardsFromJson('cards/onpiece-anime.json'),
];
const roomsManager = new RoomsManager();

Promise.all(cards).then((cards) => {
	// Handle a connection event from a client
	io.on('connection', (socket) => {
		console.log('A user connected', socket.id);
		socket.emit(SocketEvent.RecievedCardChoices, cards);
		socket.on(SocketEvent.JoinRoom, (roomId, player: PlayerInfo) => {
			console.log('JoinRoom', roomId, socket.id);
			const room = roomsManager.joinRoom(roomId, player, socket);
		});
		socket.on(SocketEvent.CreateRoom, (cardId, player: PlayerInfo) => {
			console.log('CreateRoom', cardId, socket.id);
			const room = roomsManager.createRoom(cardId, player, socket);
		});
		socket.on('disconnect', () => {
			console.log('A user disconnected', socket.id);
		});
	});

	// Start the server
	server.listen(PORT, () => {
		console.log(`Server is running on port ${PORT} http://localhost:${PORT}`);
	});
});
