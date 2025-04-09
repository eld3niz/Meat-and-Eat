# Meet and Eat - Developer Documentation (Improved)

This document provides instructions for setting up, running, understanding, and deploying the Meet and Eat application.

## 1. Introduction / Overview

*   **Project Purpose & Goals:**
    *   "Meet and Eat" is a web platform designed to connect users, particularly travelers, for shared meals and activities based on location and travel plans.
    *   Key objectives: Facilitate social connections, enable discovery of companions during travel, manage user profiles and travel itineraries, and provide location-based searching.
*   **High-Level Architecture:**
    *   Conceptual Diagram: `[React Frontend (Vite + TS)]` <-> `[Supabase (BaaS)]` <-> `[PostgreSQL Database]`
    *   Flow: Users interact with the React frontend. The frontend communicates with Supabase via the `supabase-js` library for data operations (CRUD), authentication, and potentially file storage or edge functions.
*   **Target Audience:**
    *   Developers involved in setting up, maintaining, extending, or debugging the application. This includes the original author needing a reference.
*   **Target User Description:**
    *   End-users are travelers, locals, or anyone seeking social interactions over meals or activities in specific geographic locations.

## 2. Technology Stack

*   **Core Technologies:**
    *   **Frontend:** React (`[Specify Version, e.g., 18.x]`)
    *   **Backend:** Supabase (Backend as a Service)
    *   **Database:** PostgreSQL (via Supabase)
    *   **Authentication:** Supabase Auth
    *   **Styling:** Tailwind CSS (`[Specify Version, e.g., 3.x]`)
    *   **Build Tool:** Vite (`[Specify Version, e.g., 5.x]`)
    *   **Language:** TypeScript (`[Specify Version, e.g., 5.x]`)
*   **Development & Infrastructure:**
    *   **Version Control:** Git / GitHub
    *   **Package Manager:** npm
    *   **Runtime:** Node.js (`[Specify Exact Version, e.g., v18.18.0 or use .nvmrc]`) - Using a Node version manager like `nvm` is recommended.
    *   **Local Supabase Dev:** Supabase CLI
    *   **Deployment Platform:** TBD (See Deployment section)
*   **Key Libraries/Packages (Check `package.json` for full list):**
    *   `@supabase/supabase-js`: Supabase client library.
    *   `react-router-dom`: Client-side routing.
    *   `[Specify State Management Library, e.g., Zustand, Context API]`: Application state management.
    *   `[Date Formatting Library, e.g., date-fns]`
    *   `[Mapping Library, e.g., react-leaflet, mapbox-gl]`
*   **Rationale for Key Technology Choices:**
    *   **Supabase:** Provides an integrated suite of backend tools (DB, Auth, Storage, Functions) built on open-source foundations, simplifying development.
    *   **React:** Robust component model, large community, extensive ecosystem.
    *   **TypeScript:** Enhances code quality and developer experience through static typing.
    *   **Vite:** Offers fast development startup and build times.
    *   **Tailwind CSS:** Enables rapid UI development with a utility-first approach.
    *   **Supabase CLI:** Essential for managing database migrations, local development, and type generation.

## 3. Project Structure

*   **Repository Overview:** Single repository hosted on GitHub.
*   **Key Directories & Files:**
    *   `/`: Root directory.
        *   `.env.example`: Template for environment variables.
        *   `.env.local`: Local environment variables (Gitignored).
        *   `.gitignore`: Specifies files ignored by Git.
        *   `.nvmrc` (Optional but recommended): Specifies the Node.js version for the project.
        *   `package.json`: Project metadata, dependencies, npm scripts.
        *   `package-lock.json`: Locked dependency versions.
        *   `vite.config.ts`: Vite configuration.
        *   `tsconfig.json`: TypeScript configuration.
        *   `tailwind.config.js`: Tailwind CSS configuration.
        *   `postcss.config.js`: PostCSS configuration.
    *   `/.git/`: Git internal data.
    *   `/public/`: Static assets served directly by the webserver.
    *   `/src/`: Main frontend application source code.
        *   `assets/`: Static assets (images, fonts) used by the React app.
        *   `components/`: Reusable React UI components.
        *   `contexts/` or `store/`: State management logic.
        *   `hooks/`: Custom React Hooks.
        *   `lib/` or `utils/`: Utility functions, Supabase client setup (`supabaseClient.ts`).
        *   `pages/` or `views/`: Top-level page components for routes.
        *   `services/`: API interaction layer (optional).
        *   `styles/` or `index.css`: Global styles, Tailwind imports.
        *   `types/`: TypeScript type definitions.
            *   `supabase.ts`: Auto-generated Supabase schema types (from DB schema).
        *   `main.tsx`: Application entry point.
        *   `App.tsx`: Root component, router setup.
    *   `/supabase/`: Supabase CLI configuration and database assets.
        *   `config.toml`: Supabase project configuration.
        *   `migrations/`: Database schema migration files (SQL).
        *   `seed.sql` (Optional): Script to populate the database with initial seed data.

## 4. Setup and Installation (Using Supabase CLI)

This guide assumes you are using the Supabase CLI for local development and database management.

*   **Prerequisites:**
    *   **Git:** [https://git-scm.com/](https://git-scm.com/)
    *   **Node.js:** Use the version specified in `.nvmrc` or `[Specify Exact Version, e.g., v18.18.0]`.
        *   *(Recommended)* Install `nvm` (Node Version Manager): [https://github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm)
    *   **npm:** Comes with Node.js.
    *   **Supabase CLI:** [https://supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli)
        *   Install via npm: `npm install supabase --save-dev` (local project dependency) or globally `npm install -g supabase`. Using a local dependency is often preferred for team consistency. Use `npx supabase` to run commands if installed locally.
    *   **Docker:** Required by Supabase CLI for the local development environment. [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/) (Ensure Docker Desktop is running).
    *   **Supabase Account:** [https://supabase.com/](https://supabase.com/) (Needed for linking project and potential deployment).

*   **Step-by-Step Setup:**

    1.  **Clone Repository:**
        ```bash
        git clone [Your GitHub Repository URL]
        cd meet-and-eat # Or your repository directory name
        ```

    2.  **Set Node.js Version (if using nvm and .nvmrc):**
        ```bash
        nvm use
        # If needed: nvm install
        ```

    3.  **Install Frontend Dependencies:**
        ```bash
        npm install
        ```

    4.  **Install Supabase CLI (if not installed globally):**
        ```bash
        # If not already a dev dependency in package.json
        npm install supabase --save-dev
        ```
        *(Use `npx supabase <command>` for subsequent Supabase commands if installed locally)*

    5.  **Log in to Supabase CLI:**
        ```bash
        npx supabase login
        ```
        *(Follow the prompts to authenticate via browser)*

    6.  **Link to Remote Supabase Project (Optional but Recommended):**
        *   If you have an existing Supabase project for this app (e.g., for staging/production), link it. Find your `<project-ref>` in your Supabase project dashboard URL (`<project-ref>.supabase.co`).
        ```bash
        # Replace <your-project-ref> with your actual project reference ID
        npx supabase link --project-ref <your-project-ref>
        # Enter the database password when prompted
        ```
        *   If you don't have a remote project yet, you can skip this and primarily use the local setup.

    7.  **Start Local Supabase Services:**
        *   This command starts a local Supabase stack using Docker (Postgres DB, GoTrue Auth, Storage, etc.).
        ```bash
        npx supabase start
        ```
        *   On the first run, this might take a while to download Docker images.
        *   **Important:** Note the local Supabase credentials printed in the terminal (API URL, anon key, service role key, DB URL).

    8.  **Configure Local Environment Variables:**
        *   Copy the example environment file:
            ```bash
            cp .env.example .env.local
            ```
        *   Open `.env.local` and fill in the values using the **local** credentials output by `supabase start`:
            *   `VITE_SUPABASE_URL`: Local API URL (e.g., `http://localhost:54321`)
            *   `VITE_SUPABASE_ANON_KEY`: Local `anon` key.
            *   *(Optional)* `SUPABASE_SERVICE_ROLE_KEY`: Local `service_role` key (if needed).

    9.  **Apply Database Migrations:**
        *   This command drops the local database, recreates it, and applies all SQL migration files found in `supabase/migrations/` (including `0000_initial_schema.sql`). It also runs `supabase/seed.sql` if present.
        ```bash
        npx supabase db reset
        ```
        *   This ensures your local database schema matches the version-controlled migrations. It will also run `seed.sql` if it exists.

    10. **Generate Supabase Types:**
        *   Generate TypeScript types based on your **local** database schema for type safety in the frontend. This should be done after applying migrations.
        ```bash
        # Generate types based on the local database schema
        npx supabase gen types typescript --local --schema public > src/types/supabase.ts
        ```
        *   Commit the generated `src/types/supabase.ts` file.

    11. **Run Frontend Development Server:**
        ```bash
        npm run dev
        ```
        *   Access the application at the URL provided (e.g., `http://localhost:5173`).

    12. **Verification:**
        *   Open the app in your browser.
        *   Try basic actions like signing up or logging in.
        *   Check the browser's developer console for any errors related to Supabase connection or API calls.
        *   Access the local Supabase Studio (URL provided by `supabase start`, usually `http://localhost:54323`) to inspect the database, auth users, etc.

*   **Building for Production:**
    ```bash
    npm run build
    ```
    *   Generates a production build in the `/dist` directory.

## 5. Backend Details (Supabase)

*   **Authentication:**
    *   **Setup:** Primarily configured via the Supabase Dashboard for the *remote* project (Authentication > Providers, Settings, Email Templates). Local setup uses defaults unless customized via `supabase/config.toml`.
    *   **Frontend Integration:** Uses `@supabase/supabase-js` client (`supabase.auth` methods). Auth state typically managed via React Context or a state management library, listening with `onAuthStateChange`.
*   **Database Schema & Migrations:**
    *   **Authoritative Source:** The database schema, RLS policies, and functions are defined and version-controlled via SQL migration files located in the `supabase/migrations/` directory (e.g., `0000_initial_schema.sql`). **Do not make schema changes directly in the Supabase Dashboard GUI for the remote project**; instead, create and manage changes through migration files.
    *   **Creating New Migrations (for future changes):**
        1.  Make schema changes using SQL (e.g., using Supabase Studio locally or your preferred DB tool connected to the local DB).
        2.  Generate a new migration file reflecting the changes:
            ```bash
            # Describe the change in the name
            npx supabase migration new create_posts_table
            ```
        3.  The CLI attempts to diff the local DB against the last migration. Review and edit the generated SQL file in `supabase/migrations/` to ensure it's correct.
    *   **Applying Migrations:**
        *   **Locally:** `npx supabase db reset` (resets and applies all migrations + seed) or `npx supabase migration up` (applies pending migrations).
        *   **Remotely (Staging/Production):** `npx supabase db push` (Applies pending local migrations to the linked remote database). **Use with extreme caution, especially on production.** Review changes carefully.
    *   **Key Tables (Summary):** `users`, `profiles`, `trips`, `meetups`, `user_locations` (Refer to `supabase/migrations/0000_initial_schema.sql` for full details).
    *   **Relationships:** Defined within migration SQL (e.g., `FOREIGN KEY` constraints).
    *   **Row Level Security (RLS):**
        *   **Importance:** Essential for data security. Policies restrict which rows users can access or modify based on defined rules.
        *   **Implementation:** Defined as `CREATE POLICY ...` statements within the migration files (see `supabase/migrations/0000_initial_schema.sql`).
        *   **Review:** Test policies thoroughly locally and review them in the Supabase Dashboard > Authentication > Policies for the remote project.
*   **API Interaction (`supabase-js`):**
    *   **Client Initialization:** Centralized in `src/lib/supabaseClient.ts` (or similar), using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from environment variables.
    *   **Type Safety:** Utilize the generated types from `src/types/supabase.ts` when making queries.
        ```typescript
        import { PostgrestSingleResponse } from '@supabase/supabase-js';
        import supabase from '../lib/supabaseClient';
        import { Database } from '../types/supabase'; // Import generated types

        type Profile = Database['public']['Tables']['profiles']['Row'];

        async function fetchProfile(userId: string): Promise<Profile | null> {
          const { data, error }: PostgrestSingleResponse<Profile> = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

          if (error) {
            console.error("Error fetching profile:", error);
            return null;
          }
          return data;
        }
        ```
*   **Supabase Functions (Edge Functions):**
    *   *(If Used)* Located in `supabase/functions/`.
    *   Deploy via `npx supabase functions deploy [function-name]`.
    *   List functions and their purposes here.
*   **Supabase Storage:**
    *   *(If Used)* Configuration (bucket creation, policies) should ideally be managed via migrations or setup scripts if possible, or documented clearly if manual setup in the dashboard is required.
    *   Describe bucket names (e.g., `avatars`) and access policies.

## 6. Frontend Details (React)

*   **Core Components/Views:** (List major components as before: `LoginPage`, `RegistrationPage`, etc.)
*   **Routing:** Handled by `react-router-dom`. Configuration in `src/App.tsx` or `src/router.tsx`. (List key routes).
*   **State Management:** `[Specify approach, e.g., Zustand, Context API]`. Describe key stores/contexts.
*   **API Calls (Data Fetching/Mutations):**
    *   Method: `[e.g., Custom hooks using supabase-js, React Query/SWR with Supabase]`
    *   Leverage generated types (`src/types/supabase.ts`) for type safety.
    *   Describe error handling and loading state patterns.
*   **Styling:** Tailwind CSS utility classes in JSX. Configuration in `tailwind.config.js`. Global styles in `src/index.css`.
*   **User Workflows:** (Describe key flows as before: Registration, Login, etc.)

## 7. Deployment

*   **Target Platform:** `[Specify Platform, e.g., Vercel, Netlify]`
*   **Prerequisites:**
    *   A linked remote Supabase project.
    *   Account on the chosen deployment platform.
*   **General Steps:**
    1.  **Apply Migrations Remotely:** Ensure all local migrations (`supabase/migrations/`) have been applied to the *remote* Supabase project:
        ```bash
        # !! Use with caution - applies changes to your remote DB !!
        npx supabase db push
        ```
    2.  **Connect Repository:** Link the GitHub repository to Vercel/Netlify/etc.
    3.  **Configure Build Settings:**
        *   Framework Preset: Vite/React.
        *   Build Command: `npm run build`.
        *   Output Directory: `dist`.
        *   Node.js Version: Match local development version.
    4.  **Configure Environment Variables:** Set the following on the deployment platform, using the credentials from your **remote** Supabase project (Settings > API):
        *   `VITE_SUPABASE_URL`: Remote Supabase Project URL.
        *   `VITE_SUPABASE_ANON_KEY`: Remote Supabase Anon key.
    5.  **Deploy:** Trigger deployment. Configure automatic deployments on push to the main branch.
*   **Platform-Specific Instructions:** `[Link to relevant guides]`
*   **Domain Configuration:** `[Instructions if applicable]`

## 8. Troubleshooting / FAQs

*   **Common Setup Issues:**
    *   Docker not running or Docker issues.
    *   Incorrect Node.js version (`nvm use`).
    *   Supabase CLI not installed or not in PATH (`npx supabase ...`).
    *   Incorrect environment variables in `.env.local` (ensure they match `supabase start` output).
    *   Local Supabase services not started (`supabase start`).
    *   Migrations not applied locally (`supabase db reset`).
    *   RLS policies blocking access (check browser console, test queries in Supabase Studio).
*   **Debugging Tips:**
    *   Use React DevTools and browser developer console (Network, Console).
    *   Inspect local services using Supabase Studio (`http://localhost:54323`).
    *   Check logs from `supabase start` terminal.
    *   Test SQL queries and RLS directly in Supabase Studio's SQL Editor.
*   **FAQ:**
    *   Q: How to reset the local database and apply all migrations? A: Run `npx supabase db reset`. This will apply all files in `supabase/migrations/`.
    *   Q: How to generate Supabase types after a schema change? A: Ensure migrations are applied locally (`npx supabase db reset`), then run `npx supabase gen types typescript --local --schema public > src/types/supabase.ts`.
    *   Q: Where are the remote Supabase API keys? A: Supabase Dashboard > Project Settings > API.
    *   Q: How to stop local Supabase services? A: `npx supabase stop`.

## 9. Contributing (Optional)

*   **Code Style:** Enforced by ESLint/Prettier (`npm run lint`, `npm run format` if configured). Follow general React/TypeScript best practices.
*   **Branching Strategy:** `[e.g., GitHub Flow: main + feature branches]`
*   **Pull Request (PR) Process:** Create PRs from feature branches to `main`. Require reviews. Ensure builds and checks pass.
*   **Commit Messages:** `[e.g., Conventional Commits]`
*   **Database Changes:** MUST be done via Supabase migrations (`supabase/migrations/`). Create a new migration file for schema changes.