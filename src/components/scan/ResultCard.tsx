import React from 'react';
import { motion } from 'framer-motion';
import { Recycle, CheckCircle, MapPin } from 'lucide-react';
import { Button } from '../ui/Button';

interface ScanResult {
    category: string;
    confidence: number;
    instructions: string;
    points: number;
    recyclable?: boolean;
}

interface ResultCardProps {
    image: string;
    result: ScanResult;
    onReset: () => void;
}

export const ResultCard: React.FC<ResultCardProps> = ({ image, result, onReset }) => {

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-4xl mx-auto bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col md:flex-row"
        >
            {/* Image Preview Side */}
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-gray-100 relative">
                <img src={image} alt="Scanned waste" className="w-full h-full object-cover" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-sm font-bold text-primary flex items-center shadow-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {result.confidence}% Confidence
                </div>
            </div>

            {/* Result Details Side */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center relative overflow-hidden">
                {/* Decorative background leaf */}
                <Recycle className="absolute -bottom-10 -right-10 w-64 h-64 text-green-50 opacity-50 rotate-[-20deg]" />

                <div className="relative z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-green-100 text-green-700 font-bold text-sm mb-4 uppercase tracking-wide">
                        {result.recyclable ? 'Recyclable' : 'Non-Recyclable'}
                    </div>

                    <h2 className="text-4xl font-bold text-gray-800 mb-2">{result.category}</h2>
                    <p className="text-gray-500 mb-6 text-lg">
                        Awesome! You just earned <span className="font-bold text-primary">{result.points} Eco Points</span>.
                    </p>

                    <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
                        <h4 className="font-bold text-gray-700 mb-2">Disposal Instructions:</h4>
                        <p className="text-gray-600">{result.instructions}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button className="flex-1" onClick={onReset}>
                            Scan Another
                        </Button>
                        <Button variant="secondary" className="flex-1">
                            <MapPin className="mr-2 w-5 h-5" />
                            Find Center
                        </Button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
