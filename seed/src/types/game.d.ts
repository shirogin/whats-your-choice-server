declare interface CardEssential<ID = number> {
	id: ID;
	name: string;
	image: string;
}
interface CardsJSON {
	id: string;
	name: string;
	image: string;
	cards: CardEssential[];
}
declare interface FormedCard extends CardEssential {
	isFlipped: boolean;
	isMatched: boolean;
	isChoosen: boolean;
	isSelected: boolean;
	isTempSelected: boolean;
	OnClick?: (id: number) => void;
}
declare interface PlayerInfo {
	username: string;
}
declare interface Player extends PlayerInfo {
	score: number;
	lastCardClicked: number | null;
	currentChoosenCard: number | null;
	cards: number[];
}
declare interface PlayerWithSocket extends Player {
	socketId: string;
}
type PlayerPosition = 'player1' | 'player2';
declare type GameStatesI = 'started' | 'notStarted' | 'finished';
declare interface GameState<StartedT extends GameStatesI = GameStatesI> {
	canSwitchMode: boolean;
	player1: StartedT extends 'notStarted' ? Player | null : Player;
	state: StartedT;
	player2: StartedT extends 'notStarted' ? Player | null : Player;
	currentTurn: StartedT extends 'notStarted' ? null : PlayerPosition;
}

declare interface GameWithCards extends GameState<true> {
	cardCollection: CardsJSON;
}
declare interface DirectedGameState extends GameState {
	to?: string;
}
declare type NotConnectedYetState = 'loading' | 'disconnected';
declare type ConnectionStates = 'connected' | NotConnectedYetState | 'inRoom';
declare interface GameEvents {
	playerLoggedIn: (socketId: string, cardsCollection: CardsJSON, roomId: string) => void;
	gameStateUpdated: (state: DirectedGameState) => void;
	playerLoggedOut: (socketId: string) => void;
	roomIsFull: (socketId: string) => void;
	playerAlreadyLoggedOut: (socketId: string, state: DirectedGameState) => void;
	errorHappened: (message: string) => void;
	playerWon: (socketId: string, player: Player) => void;
	playerLost: (socketId: string, player: Player) => void;
}
declare type GameEventsName = keyof GameEvents;
