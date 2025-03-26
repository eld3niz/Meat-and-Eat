# Implementation Plan: Account Creation and Management with Supabase

## 1. Project Setup and Authentication

-   **1.1 Supabase Project Setup:**
    -   Create a new Supabase project at [https://supabase.com/](https://supabase.com/).
    -   Obtain the Supabase API URL (e.g., `https://YOUR_PROJECT_ID.supabase.co`) and the API key (anon key).

-   **1.2 Install Supabase Client:**
    -   Install the Supabase client library in your React project:
        ```bash
        npm install @supabase/supabase-js
        ```

-   **1.3 Initialize Supabase Client:**
    -   Create a file `src/utils/supabaseClient.ts` to initialize the Supabase client:
        ```typescript
        // filepath: src/utils/supabaseClient.ts
        import { createClient } from '@supabase/supabase-js';

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
        export const supabase = createClient(supabaseUrl, supabaseKey);
        ```
    -   Make sure to set the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 2. Multi-Step Registration Form Modifications

-   **2.1 RegisterSlide1 (Email/Password):**
    -   No UI changes needed. Ensure email and password states are managed correctly.

-   **2.2 RegisterSlide2 (Name/Birthdate):**
    -   Ensure name and birthdate states are managed correctly.

-   **2.3 RegisterSlide3 (Languages/Cuisines):**
    -   Ensure languages and cuisines states are managed correctly.

-   **2.4 RegisterSlide4 (Location):**
    -   Implement location access using the Geolocation API.
    -   Add state variables for latitude, longitude, and city.
    -   Implement a function to get the user's location:
        ```typescript
        // filepath: src/components/Auth/RegisterSlide4.tsx
        const [latitude, setLatitude] = useState<number | null>(null);
        const [longitude, setLongitude] = useState<number | null>(null);

        const handleLocationAccess = () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLatitude(position.coords.latitude);
                        setLongitude(position.coords.longitude);
                        console.log("Latitude:", position.coords.latitude);
                        console.log("Longitude:", position.coords.longitude);
                    },
                    (error) => {
                        console.error("Error getting location:", error);
                        alert("Unable to retrieve location. Please try again or enter your city manually.");
                    }
                );
            } else {
                alert("Geolocation is not supported by this browser.");
            }
        };
        ```
    -   Add input field for city if location access is denied or unavailable.

## 3. Supabase Integration

-   **3.1 Modify `handleSubmit` in `MultiStepRegisterForm.tsx`:**
    ```typescript
    // filepath: src/components/Auth/MultiStepRegisterForm.tsx
    import { supabase } from '../../utils/supabaseClient';

    const handleSubmit = async () => {
        try {
            const { email, password, name, age, languages, cuisines, locationAccess, city } = formData;

            // Sign up user with email and password
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) {
                console.error("Error signing up:", authError);
                alert("Error signing up. Please try again.");
                return;
            }

            const userId = authData.user?.id;

            if (userId) {
                // Insert user data into the 'profiles' table
                const { error: profileError } = await supabase
                    .from('profiles')
                    .insert([
                        {
                            id: userId, // Use the user ID from auth.signUp
                            name: name,
                            age: age,
                            languages: languages,
                            cuisines: cuisines,
                            location_access: locationAccess,
                            city: city,
                        },
                    ]);

                if (profileError) {
                    console.error("Error inserting profile:", profileError);
                    alert("Error inserting profile. Please try again.");
                    return;
                }

                 // Insert location data into the 'user_locations' table
                 if (locationAccess && formData.latitude && formData.longitude) {
                    const { error: locationError } = await supabase
                        .from('user_locations')
                        .insert([
                            {
                                user_id: userId,
                                latitude: formData.latitude,
                                longitude: formData.longitude,
                                city: city,
                            },
                        ]);

                    if (locationError) {
                        console.error("Error inserting location:", locationError);
                        alert("Error inserting location. Please try again.");
                        return;
                    }
                }

                console.log('Registration Data:', formData);
                alert("Registration successful!");
            } else {
                console.error("User ID is null after signup.");
                alert("Registration failed. Please try again.");
            }


        } catch (error) {
            console.error("Unexpected error:", error);
            alert("An unexpected error occurred. Please try again.");
        }
    };
    ```

## 4. User Location Storage

-   **4.1 Create `user_locations` Table:**
    -   In the Supabase dashboard, create a new table named `user_locations` with the following schema:
        | Column    | Type      | Modifiers                      |
        | --------- | --------- | ------------------------------ |
        | `id`      | UUID      | Primary Key, Auto-generated    |
        | `user_id` | UUID      | Foreign Key referencing `auth.users` |
        | `latitude`  | FLOAT     |                                |
        | `longitude` | FLOAT     |                                |
        | `city`      | TEXT      |                                |
        | `timestamp` | TIMESTAMP | Default: `now()`               |

-   **4.2 Modify `RegisterSlide4.tsx`:**
    -   After obtaining location access or city selection, insert the location data into the `user_locations` table.
        ```typescript
        // filepath: src/components/Auth/RegisterSlide4.tsx
        // Assuming you have latitude, longitude, and city in your component's state
        import { supabase } from '../../utils/supabaseClient';

        const RegisterSlide4: React.FC<RegisterSlide4Props> = ({ prevSlide, handleSubmit }) => {
            const [locationAccess, setLocationAccess] = useState(false);
            const [city, setCity] = useState('');
            const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
            const [latitude, setLatitude] = useState<number | null>(null);
            const [longitude, setLongitude] = useState<number | null>(null);

            // ... existing code ...

            const handleLocationAccess = () => {
                if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            setLatitude(position.coords.latitude);
                            setLongitude(position.coords.longitude);
                            setLocationAccess(true);
                        },
                        (error) => {
                            console.error("Error getting location:", error);
                            alert("Unable to retrieve location. Please try again or enter your city manually.");
                        }
                    );
                } else {
                    alert("Geolocation is not supported by this browser.");
                }
            };

            // ... existing code ...

            return (
                // ... existing code ...
            );
        };
        ```

## 5. Login Form Modifications

-   **5.1 Modify `handleSubmit` in `LoginForm.tsx`:**
    ```typescript
    // filepath: src/components/Auth/LoginForm.tsx
    import { supabase } from '../../utils/supabaseClient';
    import { useRouter } from 'next/navigation';

    const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [showPassword, setShowPassword] = useState(false);
        const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
        const [isLoading, setIsLoading] = useState(false);
        const [loginError, setLoginError] = useState('');
        const router = useRouter();

        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setLoginError('');

            if (!validateForm()) return;

            setIsLoading(true);

            try {
                const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
                    email: email,
                    password: password,
                });

                if (authError) {
                    console.error("Error signing in:", authError);
                    setLoginError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
                    return;
                }

                console.log('Login erfolgreich mit:', { email, password });
                router.push('/');
                onSuccess();
            } catch (error) {
                console.error("Login fehlgeschlagen:", error);
                setLoginError('Anmeldung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
            } finally {
                setIsLoading(false);
            }
        };

        // ... existing code ...
    };
    ```

## 6. Data Handling and Security

-   **6.1 Error Handling:**
    -   Implement `try...catch` blocks to handle potential errors during API calls.
    -   Display user-friendly error messages using state variables (e.g., `registerError`, `loginError`).

-   **6.2 Row Level Security (RLS):**
    -   Enable RLS on the `profiles` and `user_locations` tables in Supabase.
    -   Add policies to ensure that users can only access their own data.
        -   Example policy for `profiles`: `(auth.uid() = id)`
        -   Example policy for `user_locations`: `(auth.uid() = user_id)`

-   **6.3 Environment Variables:**
    -   Store the Supabase API URL and key in environment variables to prevent them from being exposed in the client-side code.

## 7. UI Updates and Feedback

-   **7.1 Loading Indicators:**
    -   Display loading indicators during API calls (signup and login) using the `isLoading` state variable.

-   **7.2 Visual Feedback:**
    -   Provide visual feedback to the user upon successful signup or login (e.g., a success message or a redirect to the main application page).

-   **7.3 Session Management:**
    -   Use Supabase's `auth.getSession` method to handle session management.
    -   Implement a mechanism to check if the user is logged in and redirect them to the appropriate page.

## 8. Testing

-   **8.1 Registration Testing:**
    -   Verify that new users can register successfully.
    -   Verify that user data is correctly stored in the `profiles` table.
    -   Verify that location data is correctly stored in the `user_locations` table.

-   **8.2 Login Testing:**
    -   Verify that existing users can log in successfully.
    -   Verify that the user is redirected to the main application page after login.

-   **8.3 Error Handling Testing:**
    -   Test error handling by providing invalid credentials or simulating network errors.
    -   Verify that user-friendly error messages are displayed.

-   **8.4 RLS Testing:**
    -   Test RLS policies by attempting to access data belonging to other users.
    -   Verify that the policies prevent unauthorized access.