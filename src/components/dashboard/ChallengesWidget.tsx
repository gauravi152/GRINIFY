import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ChallengesWidget: React.FC = () => {
    const { user } = useAuth();
    
    // Fallback if no challenges are established
    const challenges = (user as any)?.challenges || {
        daily: { target: 3, progress: 0, completed: false },
        weekly: { target: 15, progress: 0, completed: false },
        monthly: { target: 50, progress: 0, completed: false }
    };

    return (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 md:p-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Target className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-xl font-bold text-text tracking-tight">Eco Challenges</h2>
            </div>
            
            <div className="space-y-6">
                {Object.entries(challenges).map(([key, config]: [string, any], i) => (
                    <div key={key}>
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="capitalize">{key} Challenge</span>
                            {config.completed ? (
                                <span className="text-green-600 flex items-center gap-1">
                                    <CheckCircle2 className="w-4 h-4" /> Completed
                                </span>
                            ) : (
                                <span className="text-text-light">{config.progress} / {config.target}</span>
                            )}
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min((config.progress / config.target) * 100, 100)}%` }}
                                transition={{ duration: 1, delay: i * 0.2 }}
                                className={`h-full rounded-full ${config.completed ? 'bg-green-500' : 'bg-primary'}`}
                            />
                        </div>
                        <p className="text-xs text-text-light mt-1">
                            {key === 'daily' ? 'Bonus: +20 pts' : key === 'weekly' ? 'Bonus: +100 pts' : 'Bonus: +500 pts'}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};
