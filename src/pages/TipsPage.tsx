import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, HelpCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

const categories = ['All', 'Recycling Basics', 'Composting', 'Plastic Reduction', 'Hazardous Waste'];

const tips = [
    {
        id: 1,
        category: 'Recycling Basics',
        title: 'Rinse Before You Bin',
        content: 'Food residue can contaminate an entire batch of recyclables. A quick rinse ensures your plastic and glass can actually be recycled.',
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-600'
    },
    {
        id: 2,
        category: 'Composting',
        title: 'No Meat or Dairy',
        content: 'Avoid adding meat, dairy, or oils to your home compost bin as they attract pests and slow down the decomposition process.',
        icon: AlertTriangle,
        color: 'bg-orange-100 text-orange-600'
    },
    {
        id: 3,
        category: 'Recycling Basics',
        title: 'Labels on Glass?',
        content: 'Good news! You typically don’t need to remove paper labels from glass jars and bottles. The recycling process burns them off.',
        icon: HelpCircle,
        color: 'bg-blue-100 text-blue-600'
    },
    {
        id: 4,
        category: 'Plastic Reduction',
        title: 'The Truth About "Compostable" Plastics',
        content: 'Bioplastics often require industrial composting facilities and cannot be broken down in a backyard compost heap.',
        icon: BookOpen,
        color: 'bg-primary/20 text-primary'
    },
];

export const TipsPage: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTip, setSelectedTip] = useState<any>(null);

    const filteredTips = selectedCategory === 'All'
        ? tips
        : tips.filter(tip => tip.category === selectedCategory);

    // Extended content for tips
    const extendedContent: Record<number, string> = {
        1: "Rinsing is vital because food residue can attract pests at the processing facility and even lower the value of the recycled material. For example, a single half-full peanut butter jar can ruin an entire bale of plastic. Use a bit of leftover dishwater to save resources while you rinse!",
        2: "Professional composting facilities operate at much higher temperatures than backyard bins, allowing them to break down proteins. At home, meat and dairy will rot, smell, and attract rodents. Stick to 'greens' (veggie scraps) and 'browns' (leaves, paper) for a healthy home heap.",
        3: "Modern recycling facilities use high-heat furnaces to melt glass. During this process, any paper labels or residual adhesive are simply vaporized. There is no need to spend time soaking jars to remove stickers – just focus on making sure they are empty and rinsed.",
        4: "Many people think 'bio-plastic' means it will disappear in the woods. In reality, these items often need temperatures of 140°F+ and specific microbes found only in industrial facilities to degrade. If they end up in the ocean or a landfill, they can behave just like traditional plastic."
    };

    return (
        <div className="space-y-8 relative">
            <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold text-gray-800">Tips & Education 📚</h1>
                <p className="text-gray-500 mt-1">Learn how to be an expert recycler.</p>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === cat
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                            }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Tips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTips.map((tip, index) => (
                    <motion.div
                        key={tip.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex gap-4 hover:shadow-md transition-shadow"
                    >
                        <div className={`p-3 rounded-xl h-fit ${tip.color}`}>
                            <tip.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{tip.category}</span>
                            <h3 className="text-lg font-bold text-gray-800 mt-1 mb-2">{tip.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{tip.content}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-4 -ml-4 pl-4 text-primary hover:bg-primary/5"
                                onClick={() => setSelectedTip(tip)}
                            >
                                Read More
                            </Button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Read More Modal */}
            <AnimatePresence>
                {selectedTip && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTip(null)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative z-10 border border-gray-100"
                        >
                            <div className={`p-4 rounded-2xl w-fit mb-6 ${selectedTip.color}`}>
                                <selectedTip.icon className="w-8 h-8" />
                            </div>
                            <span className="text-xs font-bold text-primary uppercase tracking-widest">{selectedTip.category}</span>
                            <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-4">{selectedTip.title}</h2>
                            <p className="text-gray-600 leading-relaxed text-lg mb-6">
                                {extendedContent[selectedTip.id] || selectedTip.content}
                            </p>
                            <Button
                                onClick={() => setSelectedTip(null)}
                                className="w-full bg-primary text-white py-6 rounded-2xl text-lg font-bold shadow-lg shadow-primary/20"
                            >
                                Got it, thanks!
                            </Button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
