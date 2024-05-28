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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const Game_1 = __importDefault(require("./Game"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const Event_1 = require("./types/Event");
// Create a new express application
const app = (0, express_1.default)();
const port = process.env.PORT;
if (!port) {
    throw new Error('Port not defined');
    process.exit(1);
}
// Enable CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => callback(null, true),
    credentials: true,
}));
// Create an HTTP server using the express app
const server = http_1.default.createServer(app);
// Create a new instance of socket.io by passing the HTTP server object
const io = new socket_io_1.Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        credentials: true,
    },
});
const game = new Game_1.default('cards/naruto-cards.json');
(_a = game.cardCollection) === null || _a === void 0 ? void 0 : _a.then((cards) => {
    console.log('cards loaded', game.getState());
    game.on('playerLoggedIn', (socketId, cardsCollection) => {
        io.to(socketId).emit(Event_1.SocketEvent.PlayerLoggedIn, cardsCollection);
    });
    game.on('gameStateUpdated', (state) => {
        console.log('Game Updated');
        if (state.to)
            io.to(state.to).emit('gameUpdated', state);
        else
            io.emit(Event_1.SocketEvent.GameUpdated, state);
    });
    game.on('playerLoggedOut', (socketId) => {
        io.to(socketId).emit(Event_1.SocketEvent.PlayerLoggedOut);
    });
    game.on('errorHappened', (message) => {
        console.log('Game Error', message);
        io.emit(Event_1.SocketEvent.Error, message);
    });
    game.on('playerAlreadyLoggedOut', (socketId, state) => {
        io.to(socketId).emit(Event_1.SocketEvent.PlayerLoggedOut);
        io.to(socketId).emit(Event_1.SocketEvent.GameUpdated, state);
    });
    game.on('playerWon', (socketId, username) => {
        console.log('player', username, 'won');
        io.to(socketId).emit(Event_1.SocketEvent.PlayerWon);
    });
    game.on('playerLost', (socketId, username) => {
        console.log('player', username, 'lost');
        io.to(socketId).emit(Event_1.SocketEvent.PlayerLost);
    });
}).catch((e) => {
    console.log(e);
});
// Serve static files from the 'public' directory
app.use(express_1.default.static('public'));
// Handle a connection event from a client
io.on('connection', (socket) => {
    console.log('A user connected');
    console.log(socket.id);
    // Handle a custom event from the client
    socket.on(Event_1.SocketEvent.LogIn, (player) => __awaiter(void 0, void 0, void 0, function* () {
        console.log('logIn', player, socket.id);
        game.logPlayer(player, socket.id);
    }));
    socket.on(Event_1.SocketEvent.ChooseCard, (cardId) => {
        console.log('ChooseCard', cardId, socket.id);
        game.playerPickCard(socket.id, cardId);
    });
    socket.on(Event_1.SocketEvent.Restart, () => {
        console.log('Restart', socket.id);
        game.restartGame();
    });
    socket.on(Event_1.SocketEvent.AddedCard, (cardId) => {
        console.log('AddedCard', cardId, socket.id);
        game.playerAddCard(socket.id, cardId);
    });
    socket.on(Event_1.SocketEvent.PassedTurn, () => {
        console.log('PassedTurn', socket.id);
        game.playerPassedTurn(socket.id);
    });
    socket.on(Event_1.SocketEvent.RemoveCard, (cardId) => {
        console.log('RemoveCard', cardId, socket.id);
        game.playerEliminatedCard(socket.id, cardId);
    });
    socket.on(Event_1.SocketEvent.GuessCard, (cardId) => {
        console.log('GuessCard', cardId, socket.id);
        game.playerDecidedCard(socket.id, cardId);
    });
    // Handle the disconnection event
    socket.on(Event_1.SocketEvent.LogOut, () => {
        console.log('A user logedOut', socket.id);
        game.logOutPlayer(socket.id);
    });
    socket.on(Event_1.SocketEvent.Disconnect, () => {
        console.log('A user disconnected', socket.id);
        game.logOutPlayer(socket.id);
    });
});
// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} http://localhost:${PORT}`);
});
//# sourceMappingURL=index.js.map