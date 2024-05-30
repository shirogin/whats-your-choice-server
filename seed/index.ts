import { execSync } from 'child_process';
import path from 'path';

const args = process.argv.slice(2);
/* 
if (args.length !== 1) {
	console.error('Usage: npm run start:file -- <fileName>');
	process.exit(1);
}
 */
const fileName = args[0];
const jsFile = path.join('./dist', fileName.replace(/\.ts$/, '.js'));
console.log({ jsFile });

// Run the specified JavaScript file
try {
	execSync(`node ${jsFile}`, { stdio: 'inherit' });
} catch (error) {
	console.error(`Error running ${fileName}:`, (error as Error).message);
	process.exit(1);
}
