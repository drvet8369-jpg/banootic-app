// scripts/supabase.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path to the workspace .env file
const envPath = path.resolve(__dirname, '../workspace/.env');

let envConfig = {};
try {
  if (fs.existsSync(envPath)) {
    const envFileContent = fs.readFileSync(envPath, 'utf-8');
    envConfig = Object.fromEntries(
      envFileContent.split('\n').filter(Boolean).map(line => {
        const [key, ...valueParts] = line.split('=');
        return [key, valueParts.join('=')];
      })
    );
  }
} catch (error) {
  console.error('Failed to read workspace/.env file:', error);
  process.exit(1);
}


// Get the Supabase access token from the config
const accessToken = envConfig.SUPABASE_ACCESS_TOKEN;

if (!accessToken || accessToken === 'YOUR_ACCESS_TOKEN_HERE') {
  console.error('\nError: SUPABASE_ACCESS_TOKEN is not set in workspace/.env');
  console.error('Please get a token from https://supabase.com/dashboard/account/tokens and add it to the file.\n');
  process.exit(1);
}

// Get the arguments passed to the npm script
const args = process.argv.slice(2).join(' ');

// Construct the command to execute
const command = `supabase ${args}`;

// Execute the command with the access token set as an environment variable
const child = exec(command, {
  env: {
    ...process.env,
    SUPABASE_ACCESS_TOKEN: accessToken,
  },
});

// Pipe the output (stdout and stderr) of the child process to the main process
child.stdout.pipe(process.stdout);
child.stderr.pipe(process.stderr);

child.on('exit', (code) => {
  process.exit(code);
});
