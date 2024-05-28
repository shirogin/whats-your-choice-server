export enum SocketEvent {
	Connect = 'connect',
	Disconnect = 'disconnect',
	/* // Emit events
	JoinRoom = 'join-room',
	LeaveRoom = 'leave-room', */
	// On events
	PlayerLoggedIn = 'playerLoggedIn',
	PlayerLoggedOut = 'playerLoggedOut',
	GameUpdated = 'gameUpdated',
	Error = 'err',

	/* emited */
	LogIn = 'logIn',
	LogOut = 'logOut',
	ChooseCard = 'chooseCard',
	RemoveCard = 'removeCard',
	AddedCard = 'addedCard',
	PassedTurn = 'passedTurn',
	GuessCard = 'guessCard',
	Restart = 'restart',

	PlayerWon = 'playerWon',
	PlayerLost = 'playerLost',
	// Price = 'price',
}
