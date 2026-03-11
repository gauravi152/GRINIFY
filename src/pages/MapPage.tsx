import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Loader2, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const MapPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFindNearby = () => {
        setIsLoading(true);
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setIsLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                // Check local storage for last scanned category to refine search
                const lastScanned = localStorage.getItem('lastScannedCategory');
                let query = 'recycling+center';

                if (lastScanned) {
                    const category = lastScanned.toLowerCase();
                    if (category.includes('plastic')) query = 'plastic+recycling';
                    else if (category.includes('metal') || category.includes('can')) query = 'metal+recycling';
                    else if (category.includes('glass')) query = 'glass+recycling';
                    else if (category.includes('paper') || category.includes('cardboard')) query = 'paper+recycling';
                    else if (category.includes('organic') || category.includes('food')) query = 'compost+center';
                    else if (category.includes('ewaste') || category.includes('electronic')) query = 'electronics+recycling';
                }

                const url = `https://www.google.com/maps/search/${query}/@${latitude},${longitude},14z`;
                window.open(url, '_blank');
                setIsLoading(false);
            },
            () => {
                // Fallback if permission denied
                const url = 'https://www.google.com/maps/search/recycling+center+near+me';
                window.open(url, '_blank');
                setIsLoading(false);
                setError('Location access denied. Opening general search.');
            }
        );
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-3xl p-12 shadow-soft border border-gray-100 w-full"
            >
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse-slow">
                    <MapPin className="w-10 h-10 text-primary" />
                </div>

                <h1 className="text-3xl font-bold text-text mb-4">Find Nearby Recycling Centers</h1>
                <p className="text-text-light mb-10 text-lg leading-relaxed">
                    Locate the nearest drop-off points for your waste.
                    <br />
                    We'll use your current location to find the best match.
                </p>

                <div className="flex flex-col gap-4 max-w-xs mx-auto">
                    <Button
                        size="lg"
                        onClick={handleFindNearby}
                        disabled={isLoading}
                        className="w-full btn-hover shadow-lg shadow-primary/20"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                                Locating...
                            </>
                        ) : (
                            <>
                                <Navigation className="mr-2 w-5 h-5" />
                                Find Centers Near Me
                            </>
                        )}
                    </Button>

                    {error && (
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-sm text-yellow-600 bg-yellow-50 py-2 px-4 rounded-lg"
                        >
                            {error}
                        </motion.p>
                    )}
                </div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                    {[
                        { icon: Search, title: "Smart Search", desc: " Finds specific centers based on your scanned waste." },
                        { icon: Navigation, title: "Directions", desc: "Get instant turn-by-turn navigation via Google Maps." },
                        { icon: MapPin, title: "Local", desc: "Prioritizes verified locations in your immediate area." }
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-2xl bg-background border border-gray-100">
                            <item.icon className="w-6 h-6 text-accent mb-3" />
                            <h3 className="font-bold text-text text-sm mb-1">{item.title}</h3>
                            <p className="text-xs text-text-light">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
};
