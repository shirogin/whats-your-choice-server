"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = exports.server = exports.PORT = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
// Create a new express application
const app = (0, express_1.default)();
const PORT = process.env.PORT;
exports.PORT = PORT;
if (!PORT) {
    throw new Error('PORT not defined');
    process.exit(1);
}
// Serve static files from the 'public' directory
app.use(express_1.default.static('public'));
// Enable CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => callback(null, origin || true),
    credentials: true,
}));
// Create an HTTP server using the express app
exports.server = http_1.default.createServer(app);
exports.io = new socket_io_1.Server(exports.server, {
    cors: {
        origin: (origin, callback) => callback(null, origin || true),
        credentials: true,
    },
});
exports.default = app;
//# sourceMappingURL=app.js.map