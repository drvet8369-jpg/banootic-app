# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Important Supabase Note

Some advanced settings in the Supabase dashboard, such as the **Database Reset** option and the **Database Connection String (URI)**, are only visible on the desktop version of the website. If you are using a mobile device, you may need to switch your browser to "Desktop site" view to access these settings.

## Manual Database Setup

If you need to set up the database from scratch, please follow these steps instead of using `npm run db:push`:

1.  Go to your Supabase project dashboard.
2.  Navigate to the **SQL Editor**.
3.  Copy the entire content of the `supabase/schema.sql` file from your project.
4.  Paste the content into the SQL Editor.
5.  Click **"Run"**. This will set up all the necessary tables and relationships correctly.
