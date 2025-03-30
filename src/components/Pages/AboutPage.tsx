import React, { useEffect } from 'react';
import HeroSection from './HomePageSections/HeroSection';
import FeaturesSection from './HomePageSections/FeaturesSection';
import GallerySection from './HomePageSections/GallerySection';
import HowItWorksSection from './HomePageSections/HowItWorksSection';
import TestimonialsSection from './HomePageSections/TestimonialsSection';
import FAQSection from './HomePageSections/FAQSection';
import CTASection from './HomePageSections/CTASection';

const AboutPage: React.FC = () => {
  // Keep the effect to manage body overflow for this specific page
  useEffect(() => {
    document.body.style.overflow = 'auto'; // Allow scrolling on this page
    return () => {
      // Restore default overflow behavior when leaving the page if needed
      // Or set to 'hidden' if that's the desired global default
      // document.body.style.overflow = 'hidden'; // Example: Restore hidden
    };
  }, []);

  return (
    // Keep the main wrapper, adjust background if needed for new design
    <div className="bg-gradient-to-b from-blue-50 to-white overflow-auto">
      <HeroSection />
      <FeaturesSection />
      <GallerySection />
      <HowItWorksSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default AboutPage;
