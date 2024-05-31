import { Server } from 'socket.io';
import { CardsCollection } from './Cards';
import GameEventEmitter from './GameEvents';
import { SocketEvent } from './types/Event';
import { io } from './app';

export default class Game extends GameEventEmitter implements GameState {
	id: string;
	player1: PlayerWithSocket | null = null;
	state: GameStatesI = 'notStarted';
	player2: PlayerWithSocket | null = null;
	currentTurn: 'player1' | 'player2' | null = null;
	players: Map<string, PlayerWithSocket> = new Map<string, PlayerWithSocket>();
	hasRoom: boolean = true;
	cardCollection: CardsCollection;
	gameCardCollection: CardsCollection;
	hasPassedTurn: boolean = true;
	hasDeleted: boolean = false;
	canSwitchMode: boolean = true;
	gameCardsSize: number;

	constructor(cardCollectionId: string, gameCardsSize = 24) {
		super();
		this.id = Math.random().toString(36).substring(2, 9);
		this.state = 'notStarted';
		this.player1 = null;
		this.hasPassedTurn = true;
		this.player2 = null;
		this.currentTurn = null;
		this.hasRoom = true;
		this.gameCardCollection =
			CardsCollection.getCardsCollection(cardCollectionId) || CardsCollection.defaultCollection;
		this.cardCollection = this.gameCardCollection.getRandomN(24);
		this.gameCardsSize = gameCardsSize;
		this.loadEvents();
	}
	async logPlayer(playerInfo: PlayerInfo, socketId: string, roomId: string) {
		let player: PlayerWithSocket;
		if (!this.hasRoom) {
			// emit user not logged bcs there is no room
			this.emit('roomIsFull', socketId);
			return;
		}
		if (this.players.has(playerInfo.username)) {
			player = this.players.get(playerInfo.username) as PlayerWithSocket;
			player.socketId = socketId;
			this.players.set(playerInfo.username, player);
		} else {
			player = {
				...playerInfo,
				socketId,
				lastCardClicked: null,
				currentChoosenCard: null,
				score: 0,
				cards: this.cardCollection.cards.map((card) => card.id),
			};
		}
		if (this.player1 === null || this.player1.username === playerInfo.username) {
			this.player1 = player;
		} else if (this.player2 === null || this.player2.username === playerInfo.username) {
			this.player2 = player;
		} else {
			this.hasRoom = false;
			this.emit('roomIsFull', socketId);
			return;
		}
		if (this.player1 !== null && this.player2 !== null) this.hasRoom = false;
		this.players.set(playerInfo.username, player);
		this.emit('playerLoggedIn', socketId, this.cardCollection, roomId);
		if (this.player1 && this.player2) {
			if (this.state === 'notStarted' && this.player1.currentChoosenCard && this.player2.currentChoosenCard) {
				this.state = 'started';
				this.currentTurn = Math.random() > 0.5 ? 'player1' : 'player2';
			}
		}
		this.EmitUpdateForBoth();
		// emit user logged
	}
	private EmitUpdateAll() {
		if (this.player1) this.emit('gameStateUpdated', { ...this.getState(), to: this.player1.socketId });
		if (this.player2) this.emit('gameStateUpdated', { ...this.getState(), to: this.player2.socketId });
	}
	private EmitUpdateForBoth() {
		if (this.player1) this.emit('gameStateUpdated', { ...this.getState('player1'), to: this.player1.socketId });
		if (this.player2) this.emit('gameStateUpdated', { ...this.getState('player2'), to: this.player2.socketId });
	}
	logOutPlayer(socketId: string): void {
		if (this.player1 !== null && this.player1.socketId === socketId) {
			this.player1 = null;
		}
		if (this.player2 !== null && this.player2.socketId === socketId) {
			this.player2 = null;
		} else {
			this.hasRoom = true;
			this.emit('playerAlreadyLoggedOut', socketId, this.getState());
			return;
		}
		this.hasRoom = true;
		this.emit('playerLoggedOut', socketId);
		this.EmitUpdateForBoth();
	}

	async restartGame(roomId: string) {
		this.state = 'notStarted';
		this.currentTurn = null;
		this.hasPassedTurn = true;
		this.hasDeleted = false;
		this.canSwitchMode = true;
		this.cardCollection = this.gameCardCollection.getRandomN(this.gameCardsSize);
		this.player1 = {
			...this.player1!,
			currentChoosenCard: null,
			cards: this.cardCollection.cards.map((card) => card.id),
		};
		this.player2 = {
			...this.player2!,
			currentChoosenCard: null,
			cards: this.cardCollection.cards.map((card) => card.id),
		};
		if (this.player1) this.emit('playerLoggedIn', this.player1.socketId, this.cardCollection, roomId);
		if (this.player2) this.emit('playerLoggedIn', this.player2.socketId, this.cardCollection, roomId);
		this.EmitUpdateForBoth();
	}

	playerPickCard(socketId: string, cardId: number) {
		const [player, otherPlayer] = this.canChooseCard(socketId);
		if (player === null) {
			// emit error
			this.emit('errorHappened', 'Player not found');
			return;
		}
		if (!player.cards.includes(cardId)) {
			// emit error
			this.emit('errorHappened', 'Card not found');
			return;
		}
		if (player.currentChoosenCard !== null) {
			// emit error
			this.emit('errorHappened', 'Player already picked a card');
			return;
		}
		player.currentChoosenCard = cardId;
		this.players.set(player.username, player);
		if (otherPlayer && otherPlayer.currentChoosenCard !== null) {
			this.state = 'started';
			this.currentTurn = Math.random() > 0.5 ? 'player1' : 'player2';
		}

		this.EmitUpdateForBoth();
	}
	playerEliminatedCard(socketId: string, cardId: number) {
		const player = this.getCurrentPlayer(socketId);
		if (player === null) {
			// emit error
			this.emit('errorHappened', 'Player not found');
			return;
		}
		if (player.currentChoosenCard === null) {
			//throw new Error('PlayerWithSocket has not picked a card');
			this.emit('errorHappened', 'Player has not picked a card');
			return;
		}

		if (!player.cards.includes(cardId)) {
			// throw new Error('Card not found');
			this.emit('errorHappened', 'Card not found');
			return;
		}

		player.cards = player.cards.filter((card) => card !== cardId);
		this.canSwitchMode = false;

		this.players.set(player.username, player);
		this.EmitUpdateForBoth();
	}
	playerAddCard(socketId: string, cardId: number) {
		const player = this.getCurrentPlayer(socketId);
		if (player === null) {
			// throw new Error('PlayerWithSocket not found');
			this.emit('errorHappened', 'Player has not picked a card');
			return;
		}
		if (player.cards.includes(cardId)) {
			// throw new Error('Card already added');
			this.emit('errorHappened', 'Card already added');
			return;
		}
		player.cards.push(cardId);
		this.canSwitchMode = false;

		this.players.set(player.username, player);
		this.EmitUpdateForBoth();
	}
	playerPassedTurn(socketId: string) {
		const player = this.getCurrentPlayer(socketId);
		if (player === null) {
			// 	throw new Error('PlayerWithSocket not found');
			this.emit('errorHappened', 'Player not found');
			return;
		}
		this.currentTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
		this.canSwitchMode = true;
		this.EmitUpdateForBoth();
	}
	playerDecidedCard(socketId: string, cardId: number) {
		const player = this.getCurrentPlayer(socketId);
		if (player === null) {
			// 	throw new Error('PlayerWithSocket not found');
			this.emit('errorHappened', 'Player has not picked a card');
			return;
		}
		const otherPlayer = this.getOtherPlayer();
		if (player.currentChoosenCard === null) {
			// throw new Error('PlayerWithSocket has not picked a card');
			this.emit('errorHappened', 'Player has not picked a card');
			return;
		}
		if (otherPlayer.currentChoosenCard === null) {
			// throw new Error('Other player has not picked a card');
			this.emit('errorHappened', 'Other player has not picked a card');
			return;
		}
		this.state = 'finished';
		if (otherPlayer.currentChoosenCard === cardId) {
			player.score++;
			this.emit('playerWon', player.socketId, player);
			this.emit('playerLost', otherPlayer.socketId, otherPlayer);
		} else {
			otherPlayer.score++;
			this.emit('playerWon', otherPlayer.socketId, otherPlayer);
			this.emit('playerLost', player.socketId, player);
		}
		this.EmitUpdateAll();
	}

	getState(stateFor?: PlayerPosition): GameState {
		return {
			currentTurn: this.currentTurn,
			canSwitchMode: this.canSwitchMode,
			state: this.state,
			player1: this.getPlayerState('player1', stateFor),
			player2: this.getPlayerState('player2', stateFor),
		};
	}

	private canChooseCard(socketId: string): [PlayerWithSocket | null, PlayerWithSocket | null] {
		if (this.player1 !== null && this.player1.socketId === socketId) return [this.player1, this.player2];
		if (this.player2 !== null && this.player2.socketId === socketId) return [this.player2, this.player1];
		return [null, null];
	}
	private getCurrentPlayer(socketId: string): PlayerWithSocket | null {
		if (this.state !== 'started' || this.player1 === null || this.player2 === null || this.currentTurn === null)
			return null;
		if (this.currentTurn === 'player1' && this.player1.socketId == socketId) return this.player1;
		if (this.currentTurn === 'player2' && this.player2.socketId === socketId) return this.player2;
		return null;
	}

	private getOtherPlayer(): PlayerWithSocket {
		return (this.currentTurn === 'player1' ? this.player2 : this.player1) as PlayerWithSocket;
	}
	private getPlayerState(stateOf: PlayerPosition, stateFor?: PlayerPosition): PlayerWithSocket | null {
		const forPlayuer = stateFor ? this[stateFor] : null;
		const ofPlayer = this[stateOf];
		return ofPlayer
			? {
					...ofPlayer,
					currentChoosenCard: forPlayuer
						? forPlayuer.username === ofPlayer.username
							? ofPlayer.currentChoosenCard
							: ofPlayer.currentChoosenCard
								? -1
								: null
						: ofPlayer.currentChoosenCard,
				}
			: null;
	}

	/* Events */
	loadEvents() {
		console.log('Game events loaded', { id: this.id });
		this.on('playerLoggedIn', (socketId, cardsCollection, roomId) => {
			io.to(socketId).emit(SocketEvent.PlayerLoggedIn, cardsCollection, roomId);
		});
		this.on('gameStateUpdated', (state) => {
			console.log('Game Updated');
			if (state.to) io.to(state.to).emit('gameUpdated', state);
			else io.emit(SocketEvent.GameUpdated, state);
		});
		this.on('playerLoggedOut', (socketId) => {
			io.to(socketId).emit(SocketEvent.PlayerLoggedOut);
		});
		this.on('errorHappened', (message) => {
			console.log('Game Error', message);
			io.emit(SocketEvent.Error, message);
		});
		this.on('playerAlreadyLoggedOut', (socketId, state) => {
			io.to(socketId).emit(SocketEvent.PlayerLoggedOut);
			io.to(socketId).emit(SocketEvent.GameUpdated, state);
		});
		this.on('playerWon', (socketId, player) => {
			console.log('player', player.username, 'won');
			io.to(socketId).emit(SocketEvent.PlayerWon, player);
		});
		this.on('playerLost', (socketId, player) => {
			console.log('player', player.username, 'lost');
			io.to(socketId).emit(SocketEvent.PlayerLost, player);
		});
	}
}
