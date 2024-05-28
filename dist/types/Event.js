"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketEvent = void 0;
var SocketEvent;
(function (SocketEvent) {
    SocketEvent["Connect"] = "connect";
    SocketEvent["Disconnect"] = "disconnect";
    /* // Emit events
    JoinRoom = 'join-room',
    LeaveRoom = 'leave-room', */
    // On events
    SocketEvent["PlayerLoggedIn"] = "playerLoggedIn";
    SocketEvent["PlayerLoggedOut"] = "playerLoggedOut";
    SocketEvent["GameUpdated"] = "gameUpdated";
    SocketEvent["Error"] = "err";
    /* emited */
    SocketEvent["LogIn"] = "logIn";
    SocketEvent["LogOut"] = "logOut";
    SocketEvent["ChooseCard"] = "chooseCard";
    SocketEvent["RemoveCard"] = "removeCard";
    SocketEvent["AddedCard"] = "addedCard";
    SocketEvent["PassedTurn"] = "passedTurn";
    SocketEvent["GuessCard"] = "guessCard";
    SocketEvent["Restart"] = "restart";
    SocketEvent["PlayerWon"] = "playerWon";
    SocketEvent["PlayerLost"] = "playerLost";
    // Price = 'price',
})(SocketEvent || (exports.SocketEvent = SocketEvent = {}));
//# sourceMappingURL=Event.js.map