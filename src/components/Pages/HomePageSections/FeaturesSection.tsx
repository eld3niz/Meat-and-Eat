import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const FeaturesSection: React.FC = () => {
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2, // Stagger children (title and grid)
      },
    },
  };

  const titleVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const gridVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3, // Stagger the cards within the grid
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 }, // Start slightly smaller and faded out
    visible: {
      opacity: 1,
      scale: 1, // Animate to full size and opacity
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section // Animate the whole section
      id="features"
      className="py-20 bg-white overflow-hidden" // Added overflow-hidden
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible" // Trigger animation when in view
      viewport={{ once: true, amount: 0.2 }} // Trigger once, when 20% is visible
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.h2 // Animate the title
          className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16"
          variants={titleVariants}
        >
          Warum mit Locals essen?
        </motion.h2>

        <motion.div // Animate the grid container
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
          variants={gridVariants} // Use grid variants to stagger cards
        >
          {/* Feature 1 */}
          <motion.div // Animate each card
            className="bg-blue-50 rounded-xl p-8 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            variants={cardVariants}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Authentische Erfahrungen</h3>
            <p className="text-gray-600">
              Erlebe die lokale Küche jenseits der Touristenpfade und entdecke Gerichte, die in keinem Reiseführer stehen.
            </p>
          </motion.div>

          {/* Feature 2 */}
          <motion.div // Animate each card
            className="bg-blue-50 rounded-xl p-8 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            variants={cardVariants}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Neue Freundschaften</h3>
            <p className="text-gray-600">
              Knüpfe Verbindungen zu Menschen aus der ganzen Welt und schaffe Freundschaften, die über den Urlaub hinaus bestehen.
            </p>
          </motion.div>

          {/* Feature 3 */}
          <motion.div // Animate each card
            className="bg-blue-50 rounded-xl p-8 shadow-md hover:shadow-lg transition transform hover:-translate-y-1"
            variants={cardVariants}
          >
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-blue-900 mb-3">Kultureller Austausch</h3>
            <p className="text-gray-600">
              Tauche tief in lokale Kulturen ein, lerne Traditionen und Geschichten kennen, die du sonst nie erfahren würdest.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FeaturesSection;