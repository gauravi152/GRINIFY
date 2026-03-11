import React from 'react';
import { motion } from 'framer-motion';

export const ScanningOverlay: React.FC = () => {
    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
            <div className="relative w-64 h-64 border-2 border-white/30 rounded-2xl overflow-hidden">
                <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 w-full h-1 bg-primary shadow-[0_0_15px_rgba(142,184,151,0.8)]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent" />
            </div>
            <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="mt-6 text-white text-lg font-medium tracking-wide"
            >
                Analyzing waste composition...
            </motion.p>
        </div>
    );
};
