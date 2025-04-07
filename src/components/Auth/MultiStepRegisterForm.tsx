import React, { useState } from 'react';
// Import original slides
import RegisterSlide1 from './RegisterSlide1';
import RegisterSlide2 from './RegisterSlide2';
import RegisterSlide3 from './RegisterSlide3';
// Import new slides
import RegisterSlideNew1 from './RegisterSlideNew1';
import RegisterSlideNew2 from './RegisterSlideNew2';
import RegisterSlideAvatar from './RegisterSlideAvatar'; // Import the new avatar slide
import DotIndicator from './DotIndicator';
import supabase from '../../utils/supabaseClient';

interface MultiStepRegisterFormProps {
  onSuccess?: () => void;
}

const MultiStepRegisterForm: React.FC<MultiStepRegisterFormProps> = ({ onSuccess }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [formData, setFormData] = useState({
    // Existing fields
    email: '',
    password: '',
    gender: '', // Add gender field
    name: '',
    // age: '', // Removed age, will be calculated or derived
    birthDay: '', // Added birth date components
    birthMonth: '', // Added birth date components
    birthYear: '', // Added birth date components
    languages: [] as string[], // Added type for clarity
    cuisines: [] as string[], // Added type for clarity
    locationAccess: false, // Note: This seems unused in current slides? Review later if needed.
    city: '', // Note: This seems unused in current slides? Review later if needed.
    // New/Modified fields
    budget: null as number | null,
    bio: '',
    avatarFile: null as File | null, // Add state for the avatar file
    // Location fields instead of is_local
    home_latitude: null as number | null,
    home_longitude: null as number | null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextSlide = () => {
    setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide - 1);
  };

  const updateFormData = (data: any) => {
    setFormData({ ...formData, ...data });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Sign up with email and password
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (signUpError) throw signUpError;
      
      if (!authData.user) {
        throw new Error('User creation failed');
      }

      // Step 2: Upload avatar if provided
      let avatarUrl: string | null = null;
      let filePath: string | null = null; // Declare filePath here
      if (formData.avatarFile) {
        const file = formData.avatarFile;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        filePath = `${authData.user.id}/${fileName}`; // Assign value here

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file);

        if (uploadError) {
          // Handle avatar upload error (maybe log it, but proceed with profile creation without avatar?)
          console.error('Avatar upload failed:', uploadError);
          // Optionally throw error to stop registration: throw new Error(`Avatar upload failed: ${uploadError.message}`);
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
          avatarUrl = urlData?.publicUrl ?? null;
        }
      }

      // Step 3: Calculate age from birth date components
      let calculatedAge: number | null = null;
      if (formData.birthYear && formData.birthMonth && formData.birthDay) {
        try {
          const yearNum = parseInt(formData.birthYear);
          const monthNum = parseInt(formData.birthMonth);
          const dayNum = parseInt(formData.birthDay);
          const birthDateObj = new Date(yearNum, monthNum - 1, dayNum);

          // Check if date is valid
          if (birthDateObj.getFullYear() === yearNum && birthDateObj.getMonth() === monthNum - 1 && birthDateObj.getDate() === dayNum) {
            let age = new Date().getFullYear() - birthDateObj.getFullYear();
            const monthDiff = new Date().getMonth() - birthDateObj.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && new Date().getDate() < birthDateObj.getDate())) {
              age--; // Adjust age if birthday hasn't occurred this year
            }
            calculatedAge = age >= 16 ? age : null; // Ensure age is 16+
          }
        } catch (e) {
          console.error("Error parsing birth date:", e);
          // Keep calculatedAge as null if parsing fails
        }
      }

      // Step 4: Update the profile with user data (including avatar_url if available)
      const profileDataToUpsert = {
        id: authData.user.id,
        name: formData.name,
        age: calculatedAge, // Use calculated age
        languages: formData.languages,
        cuisines: formData.cuisines,
        city: formData.city, // Keep city if needed elsewhere, though not in current slides
        budget: formData.budget,
        bio: formData.bio,
        home_latitude: formData.home_latitude, // Add home location
        home_longitude: formData.home_longitude, // Add home location
        home_location_last_updated: formData.home_latitude ? new Date().toISOString() : null, // Set timestamp only if location is provided
        avatar_url: avatarUrl, // Include the avatar URL here
        gender: formData.gender, // Add gender here
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileDataToUpsert, { onConflict: 'id' });

      if (profileError) {
        // If profile update fails after avatar upload, attempt to remove the uploaded avatar
        if (avatarUrl && filePath) {
          console.warn('Profile update failed after avatar upload. Attempting to remove orphaned avatar:', filePath);
          await supabase.storage.from('avatars').remove([filePath]);
        }
        console.error('Profile error details:', profileError);
        throw new Error(`Profile creation/update failed: ${profileError.message}`);
      }

      // console.log('Registration successful:', authData.user);
      
      // Call the success callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const renderSlide = () => {
    // New requested order: [5, 6, 1, 2, 3, 4] -> [Slide1, Slide2, Slide3, New1, New2, Avatar]
    // Indices:             [0, 1, 2, 3, 4, 5]
    const totalSlides = 6;

    switch (currentSlide) {
      case 0: // Slide 1: Email/Password (First Slide) - Only Next
        return <RegisterSlide1 formData={{ email: formData.email, password: formData.password, gender: formData.gender }} updateFormData={updateFormData} nextSlide={nextSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 1: // Slide 2: Name/Age (Middle Slide) - Prev & Next
        return <RegisterSlide2 formData={{ name: formData.name, birthDay: formData.birthDay, birthMonth: formData.birthMonth, birthYear: formData.birthYear }} updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 2: // Slide 3: Languages/Cuisines/City (Middle Slide) - Prev & Next
        return <RegisterSlide3 formData={{ languages: formData.languages, cuisines: formData.cuisines, city: formData.city }} updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 3: // Slide 4: Local Status & Budget (Middle Slide) - Prev & Next
        return <RegisterSlideNew1 formData={{ budget: formData.budget, home_latitude: formData.home_latitude, home_longitude: formData.home_longitude }} updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 4: // Slide 5: Bio (Middle Slide) - Prev & Next
        return <RegisterSlideNew2 formData={{ bio: formData.bio }} updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 5: // Slide 6: Avatar (Last Slide + Submit) - Prev & Submit
        return (
          <RegisterSlideAvatar
            formData={{ avatarFile: formData.avatarFile }} // Pass avatarFile
            updateFormData={updateFormData}
            prevSlide={prevSlide}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            currentSlide={currentSlide}
            totalSlides={totalSlides}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Update totalSlides to 6 */}
      <DotIndicator currentSlide={currentSlide} totalSlides={6} />
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md" role="alert">
          {error}
        </div>
      )}
      
      <div className="mt-4">
        {renderSlide()}
      </div>
    </div>
  );
};

export default MultiStepRegisterForm;
