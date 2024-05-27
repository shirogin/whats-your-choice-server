import EventEmitter from 'events';

export default class GameEventEmitter extends EventEmitter {
	on<K extends GameEventsName>(event: K, listener: GameEvents[K]): this {
		return super.on(event as string, listener as (...args: any[]) => void);
	}

	emit<K extends GameEventsName>(event: K, ...args: Parameters<GameEvents[K]>): boolean {
		return super.emit(event as string, ...args);
	}
}
