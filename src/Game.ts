import { ZodError } from 'zod';
import { CardsCollection } from './Cards';
import GameEventEmitter from './GameEvents';

export default class Game extends GameEventEmitter implements GameState {
	player1: PlayerWithSocket | null = null;
	state: GameStatesI = 'notStarted';
	player2: PlayerWithSocket | null = null;
	currentTurn: 'player1' | 'player2' | null = null;
	players: Map<string, PlayerWithSocket> = new Map<string, PlayerWithSocket>();
	hasRoom: boolean = true;
	cardCollection: Promise<CardsCollection> | null = null;
	cardCollectionMap: Map<string, CardsCollection> = new Map<string, CardsCollection>();
	hasPassedTurn: boolean = true;
	hasDeleted: boolean = false;
	canSwitchMode: boolean = true;

	constructor(cardsFile: string) {
		super();
		this.initGame(cardsFile);
	}
	async logPlayer(playerInfo: PlayerInfo, socketId: string) {
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
				cards: await this.cardCollection!.then((cards) => cards.cards.map((card) => card.id)),
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
		this.emit('playerLoggedIn', socketId, await this.cardCollection!);
		this.EmitUpdateForBoth();
		// emit user logged
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
	async loadCards(cardsFile: string): Promise<CardsCollection | null> {
		try {
			const cardCollection = await CardsCollection.loadCardsFromJson(cardsFile);
			this.cardCollectionMap.set(cardCollection.id, cardCollection);
			return cardCollection;
		} catch (e) {
			if (e instanceof ZodError) console.log('This card collection is invalid', e.errors);
			else console.error(e);
			return null;
		}
	}
	async initGame(cardsFile: string) {
		this.state = 'notStarted';
		this.player1 = null;
		this.hasPassedTurn = true;
		this.player2 = null;
		this.currentTurn = null;
		this.hasRoom = true;
		this.cardCollection = this.loadCards(cardsFile).then((cards) => {
			return this.getCardCollections();
		});
		return this.cardCollection;
	}
	async restartGame() {
		this.state = 'notStarted';
		this.currentTurn = null;
		this.hasPassedTurn = true;
		this.hasDeleted = false;
		this.canSwitchMode = true;
		this.cardCollection = this.cardCollection!.then((cards) => {
			return this.getCardCollections();
		}).then((cards) => {
			this.player1 = {
				...this.player1!,
				currentChoosenCard: null,
				cards: cards.cards.map((card) => card.id),
			};
			this.player2 = {
				...this.player2!,
				currentChoosenCard: null,
				cards: cards.cards.map((card) => card.id),
			};
			return cards;
		});
		if (this.player1) this.emit('playerLoggedIn', this.player1.socketId, await this.cardCollection!);
		if (this.player2) this.emit('playerLoggedIn', this.player2.socketId, await this.cardCollection!);
		this.EmitUpdateForBoth();
	}
	getCardCollections(cardCollectionId?: string, size = 24): CardsCollection {
		const _cardCollectionId = cardCollectionId
			? cardCollectionId
			: (this.cardCollectionMap.keys().next().value as string | undefined);
		if (!_cardCollectionId) throw new Error('Card ID collection not found');
		const cardCollection = this.cardCollectionMap.get(_cardCollectionId);
		if (cardCollection === undefined) throw new Error('Card collection not found');
		return cardCollection.getRandomN(size);
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
			this.emit('playerWon', player.socketId, player.username);
			this.emit('playerLost', otherPlayer.socketId, otherPlayer.username);
		} else {
			otherPlayer.score++;
			this.emit('playerWon', otherPlayer.socketId, otherPlayer.username);
			this.emit('playerLost', player.socketId, player.username);
		}
		this.EmitUpdateForBoth();
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
					currentChoosenCard:
						forPlayuer?.username === ofPlayer.username
							? ofPlayer.currentChoosenCard
							: ofPlayer.currentChoosenCard
								? -1
								: null,
				}
			: null;
	}
}
