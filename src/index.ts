import Game from './Game';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { SocketEvent } from '../../whats-your-choice/src/types/Event';

// Create a new express application
const app = express();

// Enable CORS
app.use(
	cors({
		origin: (origin, callback) => callback(null, true),
		credentials: true,
	})
);

// Create an HTTP server using the express app
const server = http.createServer(app);

// Create a new instance of socket.io by passing the HTTP server object
const io = new Server(server, {
	cors: {
		origin: 'http://localhost:5173',
		credentials: true,
	},
});
const game = new Game('cards/naruto-cards.json');
game.cardCollection
	?.then((cards) => {
		console.log('cards loaded', game.getState());
		game.on('playerLoggedIn', (socketId, cardsCollection) => {
			io.to(socketId).emit(SocketEvent.PlayerLoggedIn, cardsCollection);
		});
		game.on('gameStateUpdated', (state) => {
			console.log('Game Updated');
			if (state.to) io.to(state.to).emit('gameUpdated', state);
			else io.emit(SocketEvent.GameUpdated, state);
		});
		game.on('playerLoggedOut', (socketId) => {
			io.to(socketId).emit(SocketEvent.PlayerLoggedOut);
		});
		game.on('errorHappened', (message) => {
			console.log('Game Error', message);
			io.emit(SocketEvent.Error, message);
		});
		game.on('playerAlreadyLoggedOut', (socketId, state) => {
			io.to(socketId).emit(SocketEvent.PlayerLoggedOut);
			io.to(socketId).emit(SocketEvent.GameUpdated, state);
		});
		game.on('playerWon', (socketId, username) => {
			console.log('player', username, 'won');
			io.to(socketId).emit(SocketEvent.PlayerWon);
		});
		game.on('playerLost', (socketId, username) => {
			console.log('player', username, 'lost');
			io.to(socketId).emit(SocketEvent.PlayerLost);
		});
	})
	.catch((e) => {
		console.log(e);
	});
// Serve static files from the 'public' directory
app.use(express.static('public'));

// Handle a connection event from a client
io.on('connection', (socket) => {
	console.log('A user connected');
	console.log(socket.id);

	// Handle a custom event from the client
	socket.on(SocketEvent.LogIn, async (player: PlayerInfo) => {
		console.log('logIn', player, socket.id);
		game.logPlayer(player, socket.id);
	});

	socket.on(SocketEvent.ChooseCard, (cardId) => {
		console.log('ChooseCard', cardId, socket.id);
		game.playerPickCard(socket.id, cardId);
	});

	socket.on(SocketEvent.Restart, () => {
		console.log('Restart', socket.id);
		game.restartGame();
	});

	socket.on(SocketEvent.AddedCard, (cardId) => {
		console.log('AddedCard', cardId, socket.id);
		game.playerAddCard(socket.id, cardId);
	});

	socket.on(SocketEvent.PassedTurn, () => {
		console.log('PassedTurn', socket.id);
		game.playerPassedTurn(socket.id);
	});

	socket.on(SocketEvent.RemoveCard, (cardId) => {
		console.log('RemoveCard', cardId, socket.id);
		game.playerEliminatedCard(socket.id, cardId);
	});
	socket.on(SocketEvent.GuessCard, (cardId) => {
		console.log('GuessCard', cardId, socket.id);
		game.playerDecidedCard(socket.id, cardId);
	});

	// Handle the disconnection event
	socket.on(SocketEvent.LogOut, () => {
		console.log('A user logedOut', socket.id);
		game.logOutPlayer(socket.id);
	});
	socket.on(SocketEvent.Disconnect, () => {
		console.log('A user disconnected', socket.id);
		game.logOutPlayer(socket.id);
	});
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
	console.log(`Server is running on port ${PORT} http://localhost:${PORT}`);
});
