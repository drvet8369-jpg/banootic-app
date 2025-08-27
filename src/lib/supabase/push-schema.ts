// This is a helper script to apply SQL changes to the database.
// It reads all .sql files from the current directory and executes them.
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { createAdminClient } from './server';
import fs from 'fs/promises';
import path from 'path';

const supabase = createAdminClient();

async function pushSchema() {
  console.log('Looking for SQL files to push to the database...');
  
  const sqlDir = __dirname;
  const files = await fs.readdir(sqlDir);
  const sqlFiles = files.filter(file => file.endsWith('.sql'));

  if (sqlFiles.length === 0) {
    console.log('No SQL files found. Nothing to push.');
    return;
  }

  for (const file of sqlFiles) {
    console.log(`Applying schema from ${file}...`);
    const filePath = path.join(sqlDir, file);
    const sqlContent = await fs.readFile(filePath, 'utf-8');

    const { error } = await supabase.rpc('execute_sql', { sql: sqlContent });

    if (error) {
      console.error(`Error applying schema from ${file}:`, error);
      // Stop on first error
      return;
    }

    console.log(`Successfully applied ${file}.`);
  }

  console.log('Database schema push completed.');
}

// Helper function in the DB to run arbitrary SQL
const createExecuteSqlFn = async () => {
    const { error } = await supabase.rpc('execute_sql', {
        sql: `
            create or replace function execute_sql(sql text)
            returns void
            language plpgsql
            as $$
            begin
                execute sql;
            end;
            $$;
        `,
    });
    if (error && error.code !== '42723') { // 42723 is duplicate_function
        console.error('Failed to create helper function `execute_sql`', error);
        throw error;
    }
}

async function main() {
    await createExecuteSqlFn();
    await pushSchema();
}

main();
