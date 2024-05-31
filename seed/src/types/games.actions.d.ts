interface ActionI {
	type: string;
}
interface LOG_OUT_Action extends ActionI {}
interface PLAYER_LOGGED_IN_Action extends ActionI {
	payload: CardsJSON;
}
interface SET_PLAYER_NAME_Action extends ActionI {
	payload: string;
}
interface GAME_UPDATED_Action extends ActionI {
	payload: GameState;
}
interface SELECT_CARD_Action extends ActionI {
	payload: number | null;
}
