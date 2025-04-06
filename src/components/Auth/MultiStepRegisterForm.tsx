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
    name: '',
    age: '',
    languages: [] as string[], // Added type for clarity
    cuisines: [] as string[], // Added type for clarity
    locationAccess: false,
    city: '',
    // New fields
    is_local: null as string | null,
    budget: null as number | null,
    bio: '',
    avatarFile: null as File | null, // Add state for the avatar file
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

      // Step 3: Update the profile with user data (including avatar_url if available)
      const profileDataToUpsert = {
        id: authData.user.id,
        name: formData.name,
        age: parseInt(formData.age) || null,
        languages: formData.languages,
        cuisines: formData.cuisines,
        city: formData.city,
        is_local: formData.is_local,
        budget: formData.budget,
        bio: formData.bio,
        avatar_url: avatarUrl, // Include the avatar URL here
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
    // New requested order: [New2, Avatar, 1, 2, 3, New1]
    // Indices:             [   0,      1, 2, 3, 4,    5]
    const totalSlides = 6; // Keep total slides count consistent

    switch (currentSlide) {
      case 0: // New Slide 2: Bio
        return <RegisterSlideNew2 updateFormData={updateFormData} nextSlide={nextSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 1: // New Avatar Slide
        return <RegisterSlideAvatar updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 2: // Original Slide 1: Email/Password
        return <RegisterSlide1 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 3: // Original Slide 2: Name/Age
        // Note: handleSubmit is moved to the *actual* last slide (New1)
        return <RegisterSlide2 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 4: // Original Slide 3: Languages/Cuisines/City
        return <RegisterSlide3 updateFormData={updateFormData} nextSlide={nextSlide} prevSlide={prevSlide} currentSlide={currentSlide} totalSlides={totalSlides} />;
      case 5: // New Slide 1: Local Status & Budget + Submit
        return (
          <RegisterSlideNew1
            updateFormData={updateFormData}
            prevSlide={prevSlide}
            handleSubmit={handleSubmit} // Submit button is here now
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
