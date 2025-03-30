import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const HeroSection: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2, // Stagger animation of children
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 }, // Start slightly lower and faded out
    visible: {
      opacity: 1,
      y: 0, // Animate to original position and full opacity
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section // Use motion.section for the container
      className="pt-20 pb-28 px-4 md:px-8 max-w-7xl mx-auto overflow-hidden" // Added overflow-hidden to contain animations
      variants={containerVariants}
      initial="hidden"
      animate="visible" // Trigger animation on mount
    >
      <div className="text-center mb-16">
        <motion.h1 // Animate h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900 mb-6"
          variants={itemVariants}
        >
          Entdecke die Welt durch <span className="text-blue-600">gemeinsames Essen</span>
        </motion.h1>
        <motion.p // Animate paragraph
          className="text-xl text-gray-600 max-w-3xl mx-auto"
          variants={itemVariants}
        >
          Tauche ein in lokale Kulturen, triff interessante Menschen und schaffe unvergessliche Erinnerungen am Esstisch rund um den Globus.
        </motion.p>
        <motion.div // Animate button container
          className="mt-8"
          variants={itemVariants}
        >
          <a
            href="/"
            className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-medium inline-block shadow-lg hover:bg-blue-700 transition-colors mr-4"
          >
            Karte erkunden
          </a>
          <a
            href="#features"
            className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-full text-lg font-medium inline-block hover:bg-blue-50 transition-colors"
          >
            Mehr erfahren
          </a>
        </motion.div>
      </div>

      {/* Hero Image */}
      <motion.div // Animate image container
        className="relative h-96 md:h-[500px] rounded-xl overflow-hidden shadow-2xl"
        variants={itemVariants}
      >
        <img
          src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070"
          alt="Menschen genießen gemeinsam eine Mahlzeit"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
          <p className="text-white text-xl md:text-2xl font-medium">Gemeinsame Mahlzeiten verbinden Menschen rund um den Globus</p>
        </div>
      </motion.div>

      {/* Scroll Indicator - can be animated too if desired */}
      <motion.div // Animate scroll indicator
        className="flex justify-center mt-10"
        variants={itemVariants}
      >
        <div className="text-blue-600 animate-pulse text-center"> {/* Keep existing pulse animation */}
          <p className="text-sm mb-2">Scrolle, um mehr zu entdecken</p>
          <div className="flex justify-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </motion.div>
    </motion.section>
  );
};

export default HeroSection;