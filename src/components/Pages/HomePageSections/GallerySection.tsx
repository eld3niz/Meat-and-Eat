import React from 'react';
import { motion } from 'framer-motion'; // Import motion

const GallerySection: React.FC = () => {
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
        staggerChildren: 0.15, // Slightly faster stagger for images
      },
    },
  };

  const imageItemVariants = {
    hidden: { opacity: 0, scale: 0.8 }, // Start smaller and faded
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.section // Animate the section
      className="py-16 bg-blue-50 overflow-hidden"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.h2 // Animate the title
          className="text-3xl md:text-4xl font-bold text-center text-blue-900 mb-12"
          variants={titleVariants}
        >
          Kulinarische Eindrücke
        </motion.h2>

        <motion.div // Animate the grid
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
          variants={gridVariants}
        >
          {[
            "https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
            "https://images.unsplash.com/photo-1547573854-74d2a71d0826?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
          ].map((src, index) => (
            <motion.div // Animate each image container
              key={index}
              className="overflow-hidden rounded-lg h-40 md:h-64"
              variants={imageItemVariants}
              whileHover={{ scale: 1.05 }} // Use framer-motion for hover effect
              transition={{ duration: 0.3 }} // Smooth hover transition
            >
              <img
                src={src}
                alt={`Food gallery image ${index + 1}`}
                className="w-full h-full object-cover" // Removed transform classes, handled by motion
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
};

export default GallerySection;