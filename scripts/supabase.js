#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get the path to the .env file in the workspace directory
const envPath = path.resolve(__dirname, '..', 'workspace', '.env');
let accessToken = null;

// Read and parse the .env file to find the access token
try {
  if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf8');
    const match = envFileContent.match(/^SUPABASE_ACCESS_TOKEN=(.*)$/m);
    if (match && match[1]) {
      accessToken = match[1].trim();
    }
  }
} catch (error) {
  console.error('Error reading from workspace/.env:', error);
  process.exit(1);
}

// Check if the access token was found
if (!accessToken) {
  console.error('Error: SUPABASE_ACCESS_TOKEN not found in workspace/.env');
  console.error('Please create a token at https://supabase.com/dashboard/account/tokens and add it to the file.');
  process.exit(1);
}

// Get the arguments passed to the npm script (e.g., "link", "--project-ref", "...")
const args = process.argv.slice(2);

// Find the local supabase executable
const supabaseCLI = path.resolve(__dirname, '..', 'node_modules', '.bin', 'supabase');

if (!fs.existsSync(supabaseCLI)) {
    console.error('Supabase CLI not found. Please run `npm install`.');
    process.exit(1);
}

// Spawn the supabase command as a child process
const supabaseProcess = spawn(
  supabaseCLI,
  args,
  {
    // Set the environment for the child process
    env: {
      ...process.env, // Inherit parent process environment
      SUPABASE_ACCESS_TOKEN: accessToken,
    },
    // Use the same stdio as the parent, so we see the output in our terminal
    stdio: 'inherit',
  }
);

// Handle process exit
supabaseProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Supabase command exited with code ${code}`);
  }
  process.exit(code);
});

// Handle errors during spawn
supabaseProcess.on('error', (err) => {
  console.error('Failed to start Supabase CLI process:', err);
  process.exit(1);
});
