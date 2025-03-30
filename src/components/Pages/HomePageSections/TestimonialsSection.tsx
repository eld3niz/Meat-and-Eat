import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const TestimonialsSection: React.FC = () => {
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
        staggerChildren: 0.3, // Stagger the testimonials
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -30 }, // Start faded and slightly to the left
    visible: {
      opacity: 1,
      x: 0, // Animate to original position and full opacity
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  // Helper to generate star ratings
  const StarRating = ({ rating = 5 }: { rating?: number }) => (
    <div className="text-yellow-400 flex mb-2">
      {[...Array(rating)].map((_, i) => (
        <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );


  return (
    <motion.section // Animate the section
      className="py-20 bg-blue-50 overflow-hidden" // Added overflow-hidden
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
          Erfahrungen unserer Community
        </motion.h2>

        <motion.div // Animate the grid
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={gridVariants}
        >
          {/* Testimonial 1 */}
          <motion.div // Animate each card
            className="bg-white p-8 rounded-xl shadow-md"
            variants={cardVariants}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0">
                <img
                  src="/assets/default-avatar.svg"
                  alt="User Sophia M."
                  className="w-full h-full object-cover p-1"
                />
              </div>
              <div>
                <p className="font-bold">Sophia M.</p>
                <p className="text-sm text-gray-500">Berlin, Deutschland</p>
              </div>
            </div>
            <StarRating />
            <p className="text-gray-600 italic">
              "In Tokio hatte ich das beste Sushi meines Lebens, zubereitet von einem lokalen Koch, den ich über Meet and Eat kennengelernt habe. Eine unvergessliche Erfahrung!"
            </p>
          </motion.div>

          {/* Testimonial 2 */}
          <motion.div // Animate each card
            className="bg-white p-8 rounded-xl shadow-md"
            variants={cardVariants}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0">
                <img
                  src="/assets/default-avatar.svg"
                  alt="User David L."
                  className="w-full h-full object-cover p-1"
                />
              </div>
              <div>
                <p className="font-bold">David L.</p>
                <p className="text-sm text-gray-500">New York, USA</p>
              </div>
            </div>
            <StarRating />
            <p className="text-gray-600 italic">
              "Während meiner Reise durch Südamerika habe ich bei einer Familie in Rio gegessen und so viel mehr über die brasilianische Kultur gelernt, als ich je in einem Restaurant hätte erfahren können."
            </p>
          </motion.div>

          {/* Testimonial 3 */}
          <motion.div // Animate each card
            className="bg-white p-8 rounded-xl shadow-md"
            variants={cardVariants}
          >
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full overflow-hidden mr-4 flex-shrink-0">
                <img
                  src="/assets/default-avatar.svg"
                  alt="User Aisha K."
                  className="w-full h-full object-cover p-1"
                />
              </div>
              <div>
                <p className="font-bold">Aisha K.</p>
                <p className="text-sm text-gray-500">Mumbai, Indien</p>
              </div>
            </div>
            <StarRating />
            <p className="text-gray-600 italic">
              "Ich habe neue Freunde in Istanbul gefunden, mit denen ich immer noch in Kontakt bin. Wir haben über dem Essen nicht nur über Kulturen gesprochen, sondern auch tolle Insider-Tipps bekommen."
            </p>
          </motion.div>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default TestimonialsSection;