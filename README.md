# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Manual Database Setup Instructions

To set up or reset the database from scratch, please follow these steps carefully. This process ensures a clean and correct database structure.

**Step 1: Run the Cleanup Script**

1.  Go to your Supabase project dashboard.
2.  Navigate to the **SQL Editor**.
3.  Copy the entire content of the `supabase/cleanup.sql` file from your project.
4.  Paste the content into the SQL Editor.
5.  Click **"Run"**. This will delete any old tables and prepare the database for a fresh start. You might see some "does not exist" notices, which are normal.

**Step 2: Run the Main Schema Script**

1.  After the cleanup is complete, clear the SQL Editor.
2.  Copy the entire content of the `supabase/schema.sql` file.
3.  Paste this new content into the SQL Editor.
4.  Click **"Run"** again.

This will set up all the necessary tables, relationships, and **security policies** correctly. Your database should now be ready to use.
