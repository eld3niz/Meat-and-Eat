import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const HowItWorksSection: React.FC = () => {
  const sectionVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        staggerChildren: 0.2,
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
        staggerChildren: 0.25, // Stagger the steps
      },
    },
  };

  const stepVariants = {
    hidden: { opacity: 0, y: 30 }, // Start lower and faded out
    visible: {
      opacity: 1,
      y: 0, // Animate to original position and full opacity
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section // Animate the section
      id="how-it-works"
      className="py-20 bg-white overflow-hidden" // Added overflow-hidden
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.h2 // Animate the title
          className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16"
          variants={titleVariants}
        >
          Wie Meet and Eat funktioniert
        </motion.h2>

        <div className="relative">
          {/* Optional: Animate the line if desired */}
          <div className="hidden md:block h-1 bg-blue-200 absolute top-24 left-0 right-0 z-0"></div>

          <motion.div // Animate the grid container
            className="grid grid-cols-1 md:grid-cols-4 gap-8 relative z-10"
            variants={gridVariants}
          >
            {/* Step 1 */}
            <motion.div // Animate each step
              className="text-center bg-white p-4 rounded-lg"
              variants={stepVariants}
            >
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">1</div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Entdecke Städte</h3>
              <p className="text-gray-600">
                Erkunde unsere interaktive Karte und finde Städte, die dich interessieren.
              </p>
            </motion.div>

            {/* Step 2 */}
            <motion.div // Animate each step
              className="text-center bg-white p-4 rounded-lg"
              variants={stepVariants}
            >
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">2</div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Wähle eine Erfahrung</h3>
              <p className="text-gray-600">
                Suche nach Essens-Erlebnissen, die zu deinen Vorlieben und Reiseplänen passen.
              </p>
            </motion.div>

            {/* Step 3 */}
            <motion.div // Animate each step
              className="text-center bg-white p-4 rounded-lg"
              variants={stepVariants}
            >
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">3</div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Triff Locals</h3>
              <p className="text-gray-600">
                Verbinde dich mit Einheimischen, die ihre Kultur durch Essen teilen möchten.
              </p>
            </motion.div>

            {/* Step 4 */}
            <motion.div // Animate each step
              className="text-center bg-white p-4 rounded-lg"
              variants={stepVariants}
            >
              <div className="w-20 h-20 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">4</div>
              <h3 className="text-xl font-bold text-blue-900 mb-3">Genieße die Erfahrung</h3>
              <p className="text-gray-600">
                Erlebe authentische Küche und schaffe unvergessliche Erinnerungen.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HowItWorksSection;