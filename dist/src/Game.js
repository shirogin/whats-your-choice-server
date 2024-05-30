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
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const Cards_1 = require("./Cards");
const GameEvents_1 = __importDefault(require("./GameEvents"));
class Game extends GameEvents_1.default {
    constructor(cardsFile) {
        super();
        this.player1 = null;
        this.state = 'notStarted';
        this.player2 = null;
        this.currentTurn = null;
        this.players = new Map();
        this.hasRoom = true;
        this.cardCollection = null;
        this.cardCollectionMap = new Map();
        this.hasPassedTurn = true;
        this.hasDeleted = false;
        this.canSwitchMode = true;
        this.initGame(cardsFile);
    }
    logPlayer(playerInfo, socketId) {
        return __awaiter(this, void 0, void 0, function* () {
            let player;
            if (!this.hasRoom) {
                // emit user not logged bcs there is no room
                this.emit('roomIsFull', socketId);
                return;
            }
            if (this.players.has(playerInfo.username)) {
                player = this.players.get(playerInfo.username);
                player.socketId = socketId;
                this.players.set(playerInfo.username, player);
            }
            else {
                player = Object.assign(Object.assign({}, playerInfo), { socketId, lastCardClicked: null, currentChoosenCard: null, score: 0, cards: yield this.cardCollection.then((cards) => cards.cards.map((card) => card.id)) });
            }
            if (this.player1 === null || this.player1.username === playerInfo.username) {
                this.player1 = player;
            }
            else if (this.player2 === null || this.player2.username === playerInfo.username) {
                this.player2 = player;
            }
            else {
                this.hasRoom = false;
                this.emit('roomIsFull', socketId);
                return;
            }
            if (this.player1 !== null && this.player2 !== null)
                this.hasRoom = false;
            this.players.set(playerInfo.username, player);
            this.emit('playerLoggedIn', socketId, yield this.cardCollection);
            if (this.player1 && this.player2) {
                if (this.state === 'notStarted' && this.player1.currentChoosenCard && this.player2.currentChoosenCard) {
                    this.state = 'started';
                    this.currentTurn = Math.random() > 0.5 ? 'player1' : 'player2';
                }
            }
            this.EmitUpdateForBoth();
            // emit user logged
        });
    }
    EmitUpdateAll() {
        if (this.player1)
            this.emit('gameStateUpdated', Object.assign(Object.assign({}, this.getState()), { to: this.player1.socketId }));
        if (this.player2)
            this.emit('gameStateUpdated', Object.assign(Object.assign({}, this.getState()), { to: this.player2.socketId }));
    }
    EmitUpdateForBoth() {
        if (this.player1)
            this.emit('gameStateUpdated', Object.assign(Object.assign({}, this.getState('player1')), { to: this.player1.socketId }));
        if (this.player2)
            this.emit('gameStateUpdated', Object.assign(Object.assign({}, this.getState('player2')), { to: this.player2.socketId }));
    }
    logOutPlayer(socketId) {
        if (this.player1 !== null && this.player1.socketId === socketId) {
            this.player1 = null;
        }
        if (this.player2 !== null && this.player2.socketId === socketId) {
            this.player2 = null;
        }
        else {
            this.hasRoom = true;
            this.emit('playerAlreadyLoggedOut', socketId, this.getState());
            return;
        }
        this.hasRoom = true;
        this.emit('playerLoggedOut', socketId);
        this.EmitUpdateForBoth();
    }
    loadCards(cardsFile) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cardCollection = yield Cards_1.CardsCollection.loadCardsFromJson(cardsFile);
                this.cardCollectionMap.set(cardCollection.id, cardCollection);
                return cardCollection;
            }
            catch (e) {
                if (e instanceof zod_1.ZodError)
                    console.log('This card collection is invalid', e.errors);
                else
                    console.error(e);
                return null;
            }
        });
    }
    initGame(cardsFile) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    restartGame() {
        return __awaiter(this, void 0, void 0, function* () {
            this.state = 'notStarted';
            this.currentTurn = null;
            this.hasPassedTurn = true;
            this.hasDeleted = false;
            this.canSwitchMode = true;
            this.cardCollection = this.cardCollection.then((cards) => {
                return this.getCardCollections();
            }).then((cards) => {
                this.player1 = Object.assign(Object.assign({}, this.player1), { currentChoosenCard: null, cards: cards.cards.map((card) => card.id) });
                this.player2 = Object.assign(Object.assign({}, this.player2), { currentChoosenCard: null, cards: cards.cards.map((card) => card.id) });
                return cards;
            });
            if (this.player1)
                this.emit('playerLoggedIn', this.player1.socketId, yield this.cardCollection);
            if (this.player2)
                this.emit('playerLoggedIn', this.player2.socketId, yield this.cardCollection);
            this.EmitUpdateForBoth();
        });
    }
    getCardCollections(cardCollectionId, size = 24) {
        const _cardCollectionId = cardCollectionId
            ? cardCollectionId
            : this.cardCollectionMap.keys().next().value;
        if (!_cardCollectionId)
            throw new Error('Card ID collection not found');
        const cardCollection = this.cardCollectionMap.get(_cardCollectionId);
        if (cardCollection === undefined)
            throw new Error('Card collection not found');
        return cardCollection.getRandomN(size);
    }
    playerPickCard(socketId, cardId) {
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
    playerEliminatedCard(socketId, cardId) {
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
    playerAddCard(socketId, cardId) {
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
    playerPassedTurn(socketId) {
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
    playerDecidedCard(socketId, cardId) {
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
        }
        else {
            otherPlayer.score++;
            this.emit('playerWon', otherPlayer.socketId, otherPlayer);
            this.emit('playerLost', player.socketId, player);
        }
        this.EmitUpdateAll();
    }
    getState(stateFor) {
        return {
            currentTurn: this.currentTurn,
            canSwitchMode: this.canSwitchMode,
            state: this.state,
            player1: this.getPlayerState('player1', stateFor),
            player2: this.getPlayerState('player2', stateFor),
        };
    }
    canChooseCard(socketId) {
        if (this.player1 !== null && this.player1.socketId === socketId)
            return [this.player1, this.player2];
        if (this.player2 !== null && this.player2.socketId === socketId)
            return [this.player2, this.player1];
        return [null, null];
    }
    getCurrentPlayer(socketId) {
        if (this.state !== 'started' || this.player1 === null || this.player2 === null || this.currentTurn === null)
            return null;
        if (this.currentTurn === 'player1' && this.player1.socketId == socketId)
            return this.player1;
        if (this.currentTurn === 'player2' && this.player2.socketId === socketId)
            return this.player2;
        return null;
    }
    getOtherPlayer() {
        return (this.currentTurn === 'player1' ? this.player2 : this.player1);
    }
    getPlayerState(stateOf, stateFor) {
        const forPlayuer = stateFor ? this[stateFor] : null;
        const ofPlayer = this[stateOf];
        return ofPlayer
            ? Object.assign(Object.assign({}, ofPlayer), { currentChoosenCard: forPlayuer
                    ? forPlayuer.username === ofPlayer.username
                        ? ofPlayer.currentChoosenCard
                        : ofPlayer.currentChoosenCard
                            ? -1
                            : null
                    : ofPlayer.currentChoosenCard }) : null;
    }
}
exports.default = Game;
//# sourceMappingURL=Game.js.map