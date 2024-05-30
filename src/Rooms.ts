import { Socket } from 'socket.io';
import { EventEmitter } from 'stream';
import Game from './Game';
import { SocketEvent } from './types/Event';
const roomTimout = 1000 * 60 * 60; // 1 hour

class Room /* extends EventEmitter */ {
	id: string;
	game: Game;
	lastUpdated: Date;
	constructor(cardId: string, player: PlayerInfo, socket: Socket) {
		// super();
		this.id = Math.random().toString(36).substring(2, 9);
		this.game = new Game(cardId);
		this.lastUpdated = new Date();
		this.game.logPlayer(player, socket.id, this.id);
		this.loadEvents(socket);
	}
	addPlayer(player: PlayerInfo, socket: Socket) {
		this.game.logPlayer(player, socket.id, this.id);
		this.loadEvents(socket);
	}
	ChooseCard(socket: Socket) {
		const game = this.game;
		return (cardId: number) => {
			this.lastUpdated = new Date();
			console.log('ChooseCard', cardId, socket.id);
			game.playerPickCard(socket.id, cardId);
		};
	}
	RestartGame(socket: Socket) {
		const game = this.game;
		return () => {
			this.lastUpdated = new Date();
			console.log('Restart', socket.id);
			game.restartGame(this.id);
		};
	}
	AddedCard(socket: Socket) {
		const game = this.game;
		return (cardId: number) => {
			this.lastUpdated = new Date();
			console.log('AddedCard', cardId, socket.id);
			game.playerAddCard(socket.id, cardId);
		};
	}
	PassTurn(socket: Socket) {
		const game = this.game;
		return () => {
			this.lastUpdated = new Date();
			console.log('PassTurn', socket.id);
			game.playerPassedTurn(socket.id);
		};
	}
	RemoveCard(socket: Socket) {
		const game = this.game;
		return (cardId: number) => {
			this.lastUpdated = new Date();
			console.log('RemoveCard', cardId, socket.id);
			game.playerEliminatedCard(socket.id, cardId);
		};
	}
	GuessCard(socket: Socket) {
		const game = this.game;
		return (cardId: number) => {
			this.lastUpdated = new Date();
			console.log('GuessCard', cardId, socket.id);
			game.playerDecidedCard(socket.id, cardId);
		};
	}
	loadEvents(socket: Socket) {
		const game = this.game;
		const ChooseCard = this.ChooseCard(socket);
		socket.on(SocketEvent.ChooseCard, ChooseCard);
		const RestartGame = this.RestartGame(socket);
		socket.on(SocketEvent.Restart, RestartGame);
		const AddedCard = this.AddedCard(socket);
		socket.on(SocketEvent.AddedCard, AddedCard);
		const PassTurn = this.PassTurn(socket);
		socket.on(SocketEvent.PassedTurn, PassTurn);
		const RemoveCard = this.RemoveCard(socket);
		socket.on(SocketEvent.RemoveCard, RemoveCard);
		const GuessCard = this.GuessCard(socket);
		socket.on(SocketEvent.GuessCard, GuessCard);

		const logoutSocket = () => {
			console.log('LeaveRoom', socket.id);
			game.logOutPlayer(socket.id);
			// clear socket evnts
			socket.off(SocketEvent.ChooseCard, ChooseCard);
			socket.off(SocketEvent.Restart, RestartGame);
			socket.off(SocketEvent.AddedCard, AddedCard);
			socket.off(SocketEvent.PassedTurn, PassTurn);
			socket.off(SocketEvent.RemoveCard, RemoveCard);
			socket.off(SocketEvent.GuessCard, GuessCard);
		};
		// Handle the disconnection event
		socket.on(SocketEvent.LogOut, logoutSocket);
		socket.on(SocketEvent.Disconnect, logoutSocket);
		socket.on(SocketEvent.LeaveRoom, logoutSocket);
	}
	isRoomAvailable() {
		return this.game.hasRoom;
	}
}

export class RoomsManager extends EventEmitter {
	rooms: Map<string, Room> = new Map<string, Room>();
	constructor() {
		super();
	}
	createRoom(cardId: string, player: PlayerInfo, socket: Socket) {
		const room = new Room(cardId, player, socket);
		this.rooms.set(room.id, room);
		// socket.emit(SocketEvent.RoomJoined, room.id);
		setInterval(() => {
			const now = new Date();
			const lastUpdated = room.lastUpdated;
			const diff = now.getTime() - lastUpdated.getTime();
			if (diff > roomTimout) {
				this.rooms.delete(room.id);
				// deallocate room.game and room
			}
		}, roomTimout);
	}
	joinRoom(roomId: string, player: PlayerInfo, socket: Socket) {
		const room = this.rooms.get(roomId);
		if (!room) socket.emit(SocketEvent.Error, 'Room not found');
		else if (!room.isRoomAvailable()) socket.emit(SocketEvent.Error, 'Room is full');
		else {
			room.addPlayer(player, socket);
			// socket.emit(SocketEvent.RoomJoined, room.id);
			socket.join(roomId);
		}
	}
	removeRoom(roomId: string) {
		this.rooms.delete(roomId);
	}
}
