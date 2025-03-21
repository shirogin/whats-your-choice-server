import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

// Create a new express application
const app = express();
const PORT = process.env.PORT;
if (!PORT) {
	throw new Error('PORT not defined');
	process.exit(1);
}
export { PORT };
// Serve static files from the 'public' directory
app.use(express.static('public'));
// Enable CORS
app.use(
	cors({
		origin: (origin, callback) => callback(null, origin || true),
		credentials: true,
	})
);
app.get('/healthz', (req, res) => {
	res.send('server is healthy and alive.');
});
// Create an HTTP server using the express app
export const server = http.createServer(app);

export const io = new Server(server, {
	cors: {
		origin: (origin, callback) => callback(null, origin || true),
		credentials: true,
	},
});

export default app;
