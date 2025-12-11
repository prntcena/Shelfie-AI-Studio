import React from 'react';
import { motion } from 'framer-motion';

export const LoadingShimmer = () => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl bg-gray-100">
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{ translateX: ["-100%", "100%"] }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: "linear",
        }}
        style={{
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)",
        }}
      />
    </div>
  );
};
