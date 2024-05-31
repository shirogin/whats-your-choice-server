import { z, ZodType } from 'zod';

export { z };
type KeysOfType<T extends object> = Exclude<keyof T, symbol | number>;

export type MyZodType<T extends object = object> = {
	[key in KeysOfType<T>]: ZodType<T[key]>;
};
