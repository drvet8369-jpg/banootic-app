// This file is server-side only. Do not import it in client components.
import fs from 'fs/promises';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'src', 'debug-log.txt');

// Ensure the log file exists and is writable.
async function initializeLogFile() {
    try {
        await fs.access(logFilePath);
    } catch (error) {
        await fs.writeFile(logFilePath, `--- Debug Log Initialized at ${new Date().toISOString()} ---\n\n`);
    }
}

// Call initialization once when the module is loaded.
initializeLogFile();

export async function logToFile(message: string) {
    // This function should only run on the server.
    if (typeof window !== 'undefined') return;

    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    try {
        await fs.appendFile(logFilePath, logMessage);
    } catch (error) {
        console.error("CRITICAL: Failed to write to log file.", error);
    }
}
