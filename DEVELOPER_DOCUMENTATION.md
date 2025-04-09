# Meet and Eat - Developer Documentation

## 1. Introduction / Overview

*   **Project Purpose & Goals:**
    *   Detailed description of the "Meet and Eat" concept: A web platform connecting users (especially travelers) for shared meals and activities based on location and travel plans.
    *   Key objectives: Facilitate social connections, provide a platform for finding companions during travel, user profile management, location-based searching.
*   **High-Level Architecture:**
    *   Conceptual Diagram/Description: `[React Frontend Application]` <-> `[Supabase (Backend as a Service)]` <-> `[PostgreSQL Database]`
    *   Brief explanation of the flow: User interacts with the React frontend, which communicates with Supabase for data, authentication, and other backend services.
*   **Target Audience:**
    *   Primarily developers (including the original author) responsible for maintaining, extending, or setting up the application.
*   **Target User Description:**
    *   Description of the end-users: Travelers, locals, individuals looking to socialize over meals/activities in specific locations.

## 2. Technology Stack

*   **Core Technologies:**
    *   **Frontend:** React (Version: `[Specify React Version, check package.json]`)
    *   **Backend:** Supabase (BaaS)
    *   **Database:** PostgreSQL (via Supabase)
    *   **Authentication:** Supabase Auth
    *   **Styling:** Tailwind CSS (Version: `[Specify Version, check package.json]`) - *Inferred from `tailwind.config.js`*
    *   **Build Tool:** Vite - *Inferred from `vite.config.ts`*
    *   **Language:** TypeScript - *Inferred from `.tsx`, `tsconfig.json`*
*   **Development & Infrastructure:**
    *   **Version Control:** Git / GitHub
    *   **Package Manager:** npm (Node.js Version: `[Specify Recommended/Required Version, e.g., >=18.x]`)
    *   **Runtime:** Node.js
    *   **Deployment Platform:** TBD (Currently not deployed)
*   **Key Libraries/Packages (Examples - Check `package.json`):**
    *   `@supabase/supabase-js`: For interacting with Supabase backend.
    *   `react-router-dom`: For handling client-side routing.
    *   `[Specify State Management Library, e.g., React Context API, Zustand, Redux Toolkit]`: If used for managing application state.
    *   `[Date Formatting Library, e.g., date-fns, moment]`
    *   `[Mapping Library, e.g., Leaflet, Mapbox GL JS]`: If a map feature is implemented.
*   **Rationale for Key Technology Choices:**
    *   **Supabase:** Chosen for its integrated backend services (Auth, DB, potentially Storage/Functions), ease of use, generous free tier, and PostgreSQL foundation.
    *   **React:** Chosen for its component-based architecture, large ecosystem, developer familiarity, and performance capabilities (virtual DOM).
    *   **Tailwind CSS:** Utility-first approach for rapid UI development and consistency.
    *   **Vite:** Fast development server and optimized build process.
    *   **TypeScript:** Adds static typing for improved code quality and maintainability.

## 3. Project Structure

*   **Repository Overview:**
    *   Monorepo/Single Repository structure hosted on GitHub.
*   **Key Directories:**
    *   `/`: Root directory containing configuration files.
    *   `/.git/`: Git version control metadata.
    *   `/public/`: Static assets served directly (e.g., `favicon.ico`, `index.html` template).
    *   `/src/`: Main source code directory.
        *   `/src/assets/`: Static assets like images, fonts used within the application.
        *   `/src/components/`: Reusable React UI components.
        *   `/src/contexts/` or `/src/store/`: State management logic (React Context API, Zustand, Redux, etc.).
        *   `/src/hooks/`: Custom React Hooks.
        *   `/src/lib/` or `/src/utils/`: Utility functions, helper modules, Supabase client initialization.
        *   `/src/pages/` or `/src/views/`: Top-level page components corresponding to routes.
        *   `/src/services/`: Modules for interacting with APIs (Supabase).
        *   `/src/styles/` or `/src/index.css`: Global styles, Tailwind base/components/utilities imports.
        *   `/src/types/`: TypeScript type definitions.
        *   `/src/main.tsx`: Application entry point (renders the root React component).
        *   `/src/App.tsx`: Root application component, likely contains router setup.
*   **Critical Configuration Files:**
    *   `package.json`: Project metadata, dependencies (React, react-dom, etc.), scripts.
    *   `package-lock.json`: Locked dependency versions.
    *   `.gitignore`: Specifies intentionally untracked files by Git.
    *   `vite.config.ts`: Vite build tool configuration (includes React plugin).
    *   `tsconfig.json`: TypeScript compiler options (including JSX settings for React).
    *   `tailwind.config.js`: Tailwind CSS configuration.
    *   `postcss.config.js`: PostCSS configuration (often used with Tailwind).
    *   `.env.example`: Template for required environment variables.
    *   `.env` or `.env.local`: Local environment variables (should be gitignored).
    *   `improved_supabase_setup.md`: *Likely location* of SQL for database setup (Verify this path/file). Contains SQL for database setup.

## 4. Setup and Installation

*   **Prerequisites:**
    *   Node.js (`[Specify Recommended Version, e.g., >=18.x]`)
    *   npm (usually comes with Node.js)
    *   Git
    *   A Supabase account.
*   **Cloning the Repository:**
    ```bash
    git clone [Your GitHub Repository URL]
    cd meet-and-eat # Or your repository directory name
    ```
*   **Environment Variables:**
    *   Create a `.env.local` (or `.env`) file in the project root by copying `.env.example`.
    *   **Required Variables:**
        *   `VITE_SUPABASE_URL`: Your Supabase project URL.
        *   `VITE_SUPABASE_ANON_KEY`: Your Supabase project Anon key.
        *   *(Optional)* `SUPABASE_SERVICE_ROLE_KEY`: If needed for specific backend operations or seeding (handle with care).
        *   *(Optional)* `JWT_SECRET`: If custom JWT logic is implemented outside Supabase defaults.
    *   **Obtaining Supabase Credentials:**
        1.  Log in to your Supabase dashboard ([supabase.com](https://supabase.com)).
        2.  Navigate to your project's Settings > API.
        3.  Find the Project URL and the `anon` (public) key.
        4.  *(If needed)* Find the `service_role` (secret) key. **Warning:** Keep the service role key secure and avoid exposing it in the frontend.
*   **Dependency Installation:**
    ```bash
    npm install
    ```
*   **Database Setup:**
    1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com) and create a new project. Choose a region close to your users. Note down the database password securely.
    2.  **Locate Schema File:** Identify the correct SQL file or markdown file containing the schema definitions, RLS policies, and any initial seed data (e.g., `improved_supabase_setup.md` - **Verify this**).
    3.  **Execute SQL:**
        *   Navigate to the "SQL Editor" in your Supabase project dashboard.
        *   Click "+ New query".
        *   Copy the entire SQL content from your schema file (`improved_supabase_setup.md` or the correct file).
        *   Paste the content into the Supabase SQL Editor.
        *   Click "Run" to execute the queries.
        *   Verify that tables, functions (if any), and RLS policies are created successfully by checking the relevant sections of the Supabase dashboard (e.g., Table Editor, Authentication > Policies).
*   **Running Locally:**
    ```bash
    npm run dev
    ```
    *   Access the application at the URL provided by Vite (usually `http://localhost:5173` or similar).
*   **Building for Production:**
    ```bash
    npm run build
    ```
    *   This command will generate a production-ready build in the `dist` directory (or as configured in `vite.config.ts`).

## 5. Backend Details (Supabase)

*   **Authentication:**
    *   **Setup:** Configured via the Supabase Dashboard > Authentication > Providers.
        *   Enabled Providers: `[List enabled providers, e.g., Email/Password, Google, GitHub]`
        *   User confirmation emails/Redirect URLs configured under Authentication > Settings.
    *   **Frontend Integration:**
        *   Using the `@supabase/supabase-js` client library within React components and custom hooks.
        *   `supabase.auth.signUp()`, `supabase.auth.signInWithPassword()`, `supabase.auth.signInWithOAuth()`, `supabase.auth.signOut()`.
        *   Session management handled by `supabase-js` (usually via localStorage).
        *   Listening to auth state changes using `supabase.auth.onAuthStateChange()` (often within a root component like `App.tsx` or an Auth context provider).
    *   **Configuration:**
        *   JWT expiry settings (default or custom).
        *   Redirect URLs for OAuth providers.
        *   Email templates (if customized).
*   **Database Schema:**
    *   **Authoritative Source:** The master schema is defined in the SQL file/markdown: `improved_supabase_setup.md` (**Verify this**).
    *   **Key Tables (Summary):**
        *   `users`: Stores basic authentication information (linked to `auth.users`).
        *   `profiles`: Stores user profile details (name, bio, avatar URL, travel plans). Often linked 1:1 with `users`.
        *   `trips`: Stores user travel itineraries (location, start date, end date).
        *   `meetups`: Stores information about planned or past meetups between users.
        *   `[Other relevant tables]`
    *   **Relationships:** Describe key relationships (e.g., one-to-many between `profiles` and `trips`). *(Optional: Include a simple text-based ERD or link to an image/tool)*.
    *   **Row Level Security (RLS):**
        *   **Importance:** RLS is CRITICAL for securing user data in Supabase. Policies ensure users can only access/modify data they are permitted to.
        *   **Implementation:** Policies are defined in the `improved_supabase_setup.md` (**Verify this**) file/content.
        *   **Common Policy Examples:**
            *   Users can only select/update their own `profiles` record.
            *   Users can select `profiles` or `trips` of others based on specific criteria (e.g., overlapping travel dates/locations).
            *   Authenticated users can insert new `trips` linked to their own profile.
        *   **Review:** Policies should be reviewed carefully in the Supabase Dashboard > Authentication > Policies section.
*   **API Interaction (`supabase-js`):**
    *   **Client Initialization:** A single Supabase client instance is typically created and exported from a utility file (e.g., `src/lib/supabaseClient.ts`).
    *   **Common Query Patterns (within React components/hooks):**
        ```javascript
        import { useState, useEffect } from 'react';
        import supabase from '../lib/supabaseClient'; // Adjust path

        function UserProfile({ userId }) {
          const [profile, setProfile] = useState(null);
          const [loading, setLoading] = useState(true);
          const [error, setError] = useState(null);

          useEffect(() => {
            async function fetchProfile() {
              setLoading(true);
              const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', userId)
                .single(); // Use .single() if expecting one row

              if (error) {
                setError(error.message);
                console.error("Error fetching profile:", error);
              } else {
                setProfile(data);
              }
              setLoading(false);
            }
            fetchProfile();
          }, [userId]);

          // ... render profile, loading, or error state
        }
        ```
    *   Refer to Supabase JS documentation for detailed usage.
*   **Supabase Functions (Edge Functions):**
    *   *(If Used)* List any Edge Functions created.
    *   Purpose of each function (e.g., sending custom emails, complex backend logic, integrating with third-party APIs).
    *   Deployment method (e.g., Supabase CLI: `supabase functions deploy [function-name]`).
*   **Supabase Storage:**
    *   *(If Used)* Describe bucket setup (e.g., `avatars` bucket).
    *   Bucket access policies (public/private, RLS for storage).
    *   How file uploads (e.g., user avatars via `supabase.storage.from('avatars').upload()`) and downloads/URLs are handled.

## 6. Frontend Details (React)

*   **Core Components/Views:**
    *   `LoginPage`: Handles user login (email/pass, OAuth).
    *   `RegistrationPage`: Handles new user sign-up.
    *   `UserProfilePage`: Displays/Edits user profile information (bio, avatar, etc.).
    *   `UserTripsPage`: Displays/Manages user's travel plans.
    *   `FindUsersPage`: Allows searching/filtering users based on location/dates (potentially includes a map component).
    *   `MeetupPage`: Displays details of a specific meetup or allows creation.
    *   `Navbar`/`Sidebar`: Main application navigation components.
    *   `ProfileCard`/`TripCard`/`MeetupCard`: Reusable presentational components.
    *   `[MapComponent]`: Component responsible for displaying maps (e.g., using Leaflet/Mapbox). - *Based on `mapcomponent.js` file, assuming it's used.*
*   **Routing:**
    *   Handled by: React Router (`react-router-dom` package).
    *   Configuration location: Likely within `src/App.tsx` or a dedicated routing configuration file (e.g., `src/router.tsx`). Uses components like `<BrowserRouter>`, `<Routes>`, `<Route>`.
    *   Key Routes:
        *   `/login`
        *   `/register`
        *   `/profile/:userId`
        *   `/trips`
        *   `/find`
        *   `/meetups/:meetupId`
        *   `/settings`
        *   `/` (Homepage/Dashboard)
*   **State Management:**
    *   Approach: `[Specify approach, e.g., React Context API, Zustand, Redux Toolkit, Component State using useState/useReducer]`
    *   Key Stores/Slices/Contexts:
        *   `AuthContext`/`AuthStore`: Manages user authentication state, user object.
        *   `ProfileStore`: Manages current user's profile data.
        *   `TripStore`: Manages user's trip data.
        *   `[UI State Store, e.g., for modals, notifications]`
*   **API Calls (Data Fetching/Mutations):**
    *   Method: `[e.g., Direct calls using supabase-js client within components/custom hooks, Centralized API service layer in src/services/, Using a data-fetching library like React Query/SWR]`
    *   Custom Hooks (`src/hooks/`): Often used to encapsulate data fetching logic and state management (e.g., `useUserProfile(userId)`).
    *   Error Handling: `[Describe common error handling patterns, e.g., try/catch blocks, dedicated error states]`
    *   Loading States: `[Describe how loading states are managed, e.g., boolean state variables]`
*   **Styling:**
    *   Approach: Tailwind CSS utility classes applied directly in JSX.
    *   Configuration: `tailwind.config.js`, `postcss.config.js`.
    *   Global Styles: Defined in `src/index.css` (or equivalent), includes Tailwind base, components, utilities directives. Imported in `src/main.tsx`.
    *   Custom Components/Utilities: Any custom CSS or Tailwind plugin configurations.
*   **User Workflows (Examples):**
    1.  **Registration:** Visit `/register` -> Fill form -> Submit -> (Email confirmation?) -> Redirect to login/dashboard.
    2.  **Login:** Visit `/login` -> Enter credentials / Use OAuth -> Redirect to dashboard.
    3.  **Profile Setup:** Navigate to profile -> Click edit -> Upload avatar -> Update bio/details -> Save.
    4.  **Add Trip:** Navigate to trips section -> Click "Add Trip" -> Fill location/dates -> Save.
    5.  **Find Users:** Navigate to `/find` -> Enter location/dates -> View list/map of matching users -> Click profile to view details.
    6.  **Initiate Meetup:** (From user profile/find page) -> Click "Suggest Meetup" -> `[Describe flow]`

## 7. Deployment

*   **Target Platform:** `[Specify Platform if decided, e.g., Vercel, Netlify, AWS Amplify, Self-hosted]` (Platforms like Vercel/Netlify have excellent support for Vite/React).
*   **General Steps:**
    1.  **Connect Repository:** Link the GitHub repository to the chosen deployment platform.
    2.  **Configure Build Settings:**
        *   Framework Preset: Select "Vite" or "React".
        *   Build Command: `npm run build`
        *   Output Directory: `dist` (or as specified in `vite.config.ts`)
        *   Node.js Version: `[Match development version]`
    3.  **Configure Environment Variables:** Add the *production* Supabase URL and Anon Key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to the platform's environment variable settings. **Do not expose secret keys.**
    4.  **Deploy:** Trigger the first deployment. Set up automatic deployments on Git push (usually default).
*   **Platform-Specific Instructions:**
    *   `[Link to Vercel/Netlify/etc. specific deployment guides if applicable]`
*   **Domain Configuration:**
    *   Instructions on setting up a custom domain if required.

## 8. Troubleshooting / FAQs

*   **Common Setup Issues:**
    *   Incorrect Node.js/npm version.
    *   Missing environment variables (`.env.local` not created or variables incorrect).
    *   Supabase URL/Key typos (check `VITE_` prefix for Vite).
    *   Database schema not applied correctly (check Supabase SQL Editor logs).
    *   RLS policies blocking data access (check browser console for errors, review policies).
    *   React Router issues (ensure `<BrowserRouter>` wraps the app correctly).
*   **Debugging Tips:**
    *   Use browser developer tools (Network tab for API calls, Console for errors, React DevTools extension).
    *   Check Supabase logs (Database > Logs, Function logs if applicable).
    *   Verify RLS policies by running queries as specific users in the Supabase SQL Editor.
*   **FAQ:**
    *   Q: How to reset the database? A: Re-run the SQL from `improved_supabase_setup.md` (**Verify this**) in the Supabase SQL Editor (ensure it handles existing objects, e.g., using `DROP...CASCADE` or `CREATE OR REPLACE`).
    *   Q: Where are the Supabase API keys found? A: Project Settings > API in the Supabase dashboard.

## 9. Contributing (Optional)

*   **Code Style:** `[e.g., ESLint/Prettier configuration (check package.json scripts), general React/TypeScript best practices]`
*   **Branching Strategy:** `[e.g., Gitflow, GitHub Flow - main, develop, feature branches]`
*   **Pull Request (PR) Process:**
    *   Create feature branches from `develop` (or `main`).
    *   Ensure code builds (`npm run build`) and lints (`npm run lint` if configured) pass locally.
    *   Submit PRs against `develop` (or `main`).
    *   Require code review before merging.
*   **Commit Messages:** `[Specify preferred format, e.g., Conventional Commits]`