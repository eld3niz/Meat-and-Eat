import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const CTASection: React.FC = () => {
  const sectionVariants = {
    hidden: { opacity: 0, scale: 0.8 }, // Start faded and scaled down
    visible: {
      opacity: 1,
      scale: 1, // Animate to full opacity and scale
      transition: {
        duration: 0.7,
        ease: [0.6, 0.05, -0.01, 0.9], // Custom easing for a nice effect
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section // Animate the section
      className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white overflow-hidden" // Added overflow-hidden
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }} // Trigger when 30% is visible
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 text-center">
        <motion.h2 // Animate title
          className="text-3xl md:text-4xl font-bold mb-6"
          variants={itemVariants}
        >
          Bereit, die Welt durch Essen zu entdecken?
        </motion.h2>
        <motion.p // Animate paragraph
          className="text-xl mb-10 max-w-3xl mx-auto opacity-90"
          variants={itemVariants}
        >
          Finde lokale Essens-Erlebnisse in den faszinierendsten Städten der Welt und tauche ein in neue Kulturen.
        </motion.p>
        <motion.div // Animate button container (or just the button)
          variants={itemVariants}
        >
          <motion.a // Add hover effect to button
            href="/"
            className="bg-white text-blue-600 px-8 py-4 rounded-full text-lg font-medium inline-block shadow-lg hover:bg-blue-50 transition-colors"
            whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
          >
            Jetzt starten
          </motion.a>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default CTASection;