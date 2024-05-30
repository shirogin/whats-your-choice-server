"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Event_1 = require("./types/Event");
const Cards_1 = require("./Cards");
const Rooms_1 = require("./Rooms");
const app_1 = require("./app");
const cards = [
    Cards_1.CardsCollection.loadCardsFromJson('cards/naruto-cards.json'),
    Cards_1.CardsCollection.loadCardsFromJson('cards/onpiece.json'),
];
const roomsManager = new Rooms_1.RoomsManager();
Promise.all(cards).then((cards) => {
    // Handle a connection event from a client
    app_1.io.on('connection', (socket) => {
        console.log('A user connected', socket.id);
        socket.emit(Event_1.SocketEvent.RecievedCardChoices, cards);
        socket.on(Event_1.SocketEvent.JoinRoom, (roomId, player) => {
            console.log('JoinRoom', roomId, socket.id);
            const room = roomsManager.joinRoom(roomId, player, socket);
        });
        socket.on(Event_1.SocketEvent.CreateRoom, (cardId, player) => {
            console.log('CreateRoom', cardId, socket.id);
            const room = roomsManager.createRoom(cardId, player, socket);
        });
        socket.on('disconnect', () => {
            console.log('A user disconnected', socket.id);
        });
    });
    // Start the server
    app_1.server.listen(app_1.PORT, () => {
        console.log(`Server is running on port ${app_1.PORT} http://localhost:${app_1.PORT}`);
    });
});
//# sourceMappingURL=index.js.map