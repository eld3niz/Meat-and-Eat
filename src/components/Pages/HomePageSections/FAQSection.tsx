import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const FAQSection: React.FC = () => {
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

  const faqItemVariants = {
    hidden: { opacity: 0, x: 50 }, // Start faded and slightly to the right
    visible: {
      opacity: 1,
      x: 0, // Animate to original position and full opacity
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section // Animate the section
      className="py-20 bg-white overflow-hidden" // Added overflow-hidden
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }} // Trigger slightly earlier
    >
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <motion.h2 // Animate the title
          className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-16"
          variants={titleVariants}
        >
          Häufig gestellte Fragen
        </motion.h2>

        <motion.div // Animate the container for FAQ items to stagger them
          className="space-y-6"
          variants={sectionVariants} // Reuse section variants for staggering children
        >
          <motion.div // Animate each FAQ item
            className="bg-blue-50 rounded-lg p-6"
            variants={faqItemVariants}
          >
            <h3 className="text-lg font-bold text-blue-800 mb-2">Ist Meet and Eat überall verfügbar?</h3>
            <p className="text-gray-600">
              Meet and Eat ist derzeit in über 100 großen Städten weltweit verfügbar. Wir erweitern unser Netzwerk ständig, um noch mehr lokale Essens-Erlebnisse anzubieten.
            </p>
          </motion.div>

          <motion.div // Animate each FAQ item
            className="bg-blue-50 rounded-lg p-6"
            variants={faqItemVariants}
          >
            <h3 className="text-lg font-bold text-blue-800 mb-2">Wie werden die Gastgeber überprüft?</h3>
            <p className="text-gray-600">
              Alle Gastgeber durchlaufen einen gründlichen Verifizierungsprozess, einschließlich Identitätsprüfung und Bewertungen früherer Gäste. Sicherheit hat für uns höchste Priorität.
            </p>
          </motion.div>

          <motion.div // Animate each FAQ item
            className="bg-blue-50 rounded-lg p-6"
            variants={faqItemVariants}
          >
            <h3 className="text-lg font-bold text-blue-800 mb-2">Kann ich auch als Gastgeber teilnehmen?</h3>
            <p className="text-gray-600">
              Natürlich! Wenn du Reisenden deine lokale Küche und Kultur näherbringen möchtest, kannst du dich ganz einfach als Gastgeber registrieren und dein eigenes kulinarisches Erlebnis anbieten.
            </p>
          </motion.div>

          <motion.div // Animate each FAQ item
            className="bg-blue-50 rounded-lg p-6"
            variants={faqItemVariants}
          >
            <h3 className="text-lg font-bold text-blue-800 mb-2">Gibt es Diät-Optionen für bestimmte Ernährungsweisen?</h3>
            <p className="text-gray-600">
              Ja, viele Gastgeber bieten Optionen für vegetarische, vegane, glutenfreie und andere spezielle Ernährungsbedürfnisse an. Diese Informationen findest du in den Details jedes Essens-Erlebnisses.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FAQSection;