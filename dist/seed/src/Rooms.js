"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomsManager = void 0;
const stream_1 = require("stream");
const Game_1 = __importDefault(require("./Game"));
const Event_1 = require("./types/Event");
const roomTimout = 1000 * 60 * 60; // 1 hour
class Room /* extends EventEmitter */ {
    constructor(cardId, player, socket) {
        // super();
        this.id = Math.random().toString(36).substring(2, 9);
        this.game = new Game_1.default(cardId);
        this.lastUpdated = new Date();
        this.game.logPlayer(player, socket.id, this.id);
        this.loadEvents(socket);
    }
    addPlayer(player, socket) {
        this.game.logPlayer(player, socket.id, this.id);
        this.loadEvents(socket);
    }
    ChooseCard(socket) {
        const game = this.game;
        return (cardId) => {
            this.lastUpdated = new Date();
            console.log('ChooseCard', cardId, socket.id);
            game.playerPickCard(socket.id, cardId);
        };
    }
    RestartGame(socket) {
        const game = this.game;
        return () => {
            this.lastUpdated = new Date();
            console.log('Restart', socket.id);
            game.restartGame(this.id);
        };
    }
    AddedCard(socket) {
        const game = this.game;
        return (cardId) => {
            this.lastUpdated = new Date();
            console.log('AddedCard', cardId, socket.id);
            game.playerAddCard(socket.id, cardId);
        };
    }
    PassTurn(socket) {
        const game = this.game;
        return () => {
            this.lastUpdated = new Date();
            console.log('PassTurn', socket.id);
            game.playerPassedTurn(socket.id);
        };
    }
    RemoveCard(socket) {
        const game = this.game;
        return (cardId) => {
            this.lastUpdated = new Date();
            console.log('RemoveCard', cardId, socket.id);
            game.playerEliminatedCard(socket.id, cardId);
        };
    }
    GuessCard(socket) {
        const game = this.game;
        return (cardId) => {
            this.lastUpdated = new Date();
            console.log('GuessCard', cardId, socket.id);
            game.playerDecidedCard(socket.id, cardId);
        };
    }
    loadEvents(socket) {
        const game = this.game;
        const ChooseCard = this.ChooseCard(socket);
        socket.on(Event_1.SocketEvent.ChooseCard, ChooseCard);
        const RestartGame = this.RestartGame(socket);
        socket.on(Event_1.SocketEvent.Restart, RestartGame);
        const AddedCard = this.AddedCard(socket);
        socket.on(Event_1.SocketEvent.AddedCard, AddedCard);
        const PassTurn = this.PassTurn(socket);
        socket.on(Event_1.SocketEvent.PassedTurn, PassTurn);
        const RemoveCard = this.RemoveCard(socket);
        socket.on(Event_1.SocketEvent.RemoveCard, RemoveCard);
        const GuessCard = this.GuessCard(socket);
        socket.on(Event_1.SocketEvent.GuessCard, GuessCard);
        const logoutSocket = () => {
            console.log('LeaveRoom', socket.id);
            game.logOutPlayer(socket.id);
            // clear socket evnts
            socket.off(Event_1.SocketEvent.ChooseCard, ChooseCard);
            socket.off(Event_1.SocketEvent.Restart, RestartGame);
            socket.off(Event_1.SocketEvent.AddedCard, AddedCard);
            socket.off(Event_1.SocketEvent.PassedTurn, PassTurn);
            socket.off(Event_1.SocketEvent.RemoveCard, RemoveCard);
            socket.off(Event_1.SocketEvent.GuessCard, GuessCard);
        };
        // Handle the disconnection event
        socket.on(Event_1.SocketEvent.LogOut, logoutSocket);
        socket.on(Event_1.SocketEvent.Disconnect, logoutSocket);
        socket.on(Event_1.SocketEvent.LeaveRoom, logoutSocket);
    }
    isRoomAvailable() {
        return this.game.hasRoom;
    }
}
class RoomsManager extends stream_1.EventEmitter {
    constructor() {
        super();
        this.rooms = new Map();
    }
    createRoom(cardId, player, socket) {
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
    joinRoom(roomId, player, socket) {
        const room = this.rooms.get(roomId);
        if (!room)
            socket.emit(Event_1.SocketEvent.Error, 'Room not found');
        else if (!room.isRoomAvailable())
            socket.emit(Event_1.SocketEvent.Error, 'Room is full');
        else {
            room.addPlayer(player, socket);
            // socket.emit(SocketEvent.RoomJoined, room.id);
            socket.join(roomId);
        }
    }
    removeRoom(roomId) {
        this.rooms.delete(roomId);
    }
}
exports.RoomsManager = RoomsManager;
//# sourceMappingURL=Rooms.js.map