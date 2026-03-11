import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, User, Medal, Share2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext is in this path

export const LeaderboardPage: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const { user: currentUser } = useAuth();

    const leaderboardData = [
        { rank: 1, name: 'EcoWarrior_22', points: 4850, avatar: null },
        { rank: 2, name: 'GreenLife', points: 4210, avatar: null },
        { rank: 3, name: 'SustainQueen', points: 3980, avatar: null },
        { rank: 4, name: 'ForestGuardian', points: 3750, avatar: null },
        { rank: 5, name: 'RecycleKing', points: 3420, avatar: null },
        { rank: 42, name: `${currentUser?.name} (You)`, points: currentUser?.points || 0, avatar: currentUser?.avatar || null },
    ];

    const handleInvite = () => {
        const inviteLink = `https://grinify.app/invite?ref=user_${Math.random().toString(36).substr(2, 9)}`;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-10">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-3xl font-bold text-text tracking-tight">Top Eco Warriors 🏆</h1>
                <p className="text-text-light mt-2 max-w-md mx-auto">Compete with friends and earn your place in history.</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white rounded-3xl shadow-soft border border-gray-100 overflow-hidden"
            >
                {/* Top 3 Podium */}
                <div className="bg-gradient-to-b from-primary/5 to-transparent p-8 flex justify-center items-end gap-4 md:gap-12 pb-14 pt-12">
                    {[1, 0, 2].map((idx) => {
                        const user = leaderboardData[idx];
                        const isFirst = idx === 0;
                        return (
                            <motion.div
                                key={user.name}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 100, delay: 0.4 + idx * 0.1 }}
                                className="flex flex-col items-center relative"
                            >
                                <div className={clsx("relative rounded-full border-4 shadow-lg transition-transform hover:scale-105 duration-300",
                                    isFirst ? "w-28 h-28 border-yellow-400 z-10" : "w-20 h-20 border-white"
                                )}>
                                    <img src={user.avatar!} alt={user.name} className="w-full h-full rounded-full object-cover" />

                                    {isFirst && (
                                        <motion.div
                                            animate={{ y: [0, -5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute -top-8 left-1/2 -translate-x-1/2"
                                        >
                                            <Crown className="w-10 h-10 text-yellow-500 fill-yellow-500" />
                                        </motion.div>
                                    )}

                                    <div className={clsx("absolute -bottom-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-bold shadow-md whitespace-nowrap",
                                        isFirst ? "bg-yellow-400 text-yellow-900" : "bg-white text-gray-500"
                                    )}>
                                        #{user.rank}
                                    </div>
                                </div>

                                <p className={clsx("font-bold mt-4 tracking-tight", isFirst ? "text-lg text-text" : "text-sm text-text-light")}>
                                    {user.name}
                                </p>
                                <div className="flex items-center text-primary font-bold text-sm mt-1 bg-primary/10 px-2 py-0.5 rounded-lg">
                                    <Medal className="w-3 h-3 mr-1" />
                                    {user.points} pts
                                </div>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Full List */}
                <div className="divide-y divide-gray-50">
                    {leaderboardData.slice(3).map((user, index) => (
                        <motion.div
                            key={user.name}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.8 + index * 0.1 }}
                            whileHover={{ backgroundColor: "rgba(0,0,0,0.01)", scale: 1.005 }}
                            className={clsx(
                                "flex items-center justify-between p-5 transition-all",
                                user.name === `${currentUser?.name} (You)` ? "bg-primary/5 border-l-4 border-primary" : ""
                            )}
                        >
                            <div className="flex items-center space-x-5">
                                <span className="font-bold text-text-light/50 w-8 text-center text-xl">#{user.rank}</span>
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                    {user.avatar ? (
                                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-5 h-5 text-gray-400" />
                                    )}
                                </div>
                                <span className={clsx("font-medium text-base", user.name.includes('(You)') ? "text-primary font-bold" : "text-text")}>
                                    {user.name}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Trophy className="w-4 h-4 text-secondary" />
                                <span className="font-bold text-text">{user.points}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Invite Friends Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="bg-primary/10 rounded-3xl p-8 border border-primary/20 flex flex-col md:flex-row items-center justify-between gap-6"
            >
                <div className="text-center md:text-left">
                    <h3 className="text-xl font-bold text-text">Invite your friends! 🌿</h3>
                    <p className="text-text-light mt-1">Help grow the community and earn bonus points for every referral.</p>
                </div>
                <button
                    onClick={handleInvite}
                    className={clsx(
                        "flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95",
                        copied ? "bg-green-500 text-white" : "bg-primary text-white hover:bg-primary-dark"
                    )}
                >
                    {copied ? (
                        <>
                            <Check className="w-5 h-5" />
                            <span>Link Copied!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-5 h-5" />
                            <span>Invite Friends</span>
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
};
