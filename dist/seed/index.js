"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const args = process.argv.slice(2);
/*
if (args.length !== 1) {
    console.error('Usage: npm run start:file -- <fileName>');
    process.exit(1);
}
 */
const fileName = args[0];
const jsFile = path_1.default.join('./dist', fileName.replace(/\.ts$/, '.js'));
console.log({ jsFile });
// Run the specified JavaScript file
try {
    (0, child_process_1.execSync)(`node ${jsFile}`, { stdio: 'inherit' });
}
catch (error) {
    console.error(`Error running ${fileName}:`, error.message);
    process.exit(1);
}
//# sourceMappingURL=index.js.map