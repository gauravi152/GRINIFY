import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, User, Medal, Share2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';

interface LeaderboardUser {
    rank: number;
    name: string;
    points: number;
    avatar: string | null;
}

const Avatar: React.FC<{ name: string; src: string | null; size?: number; className?: string }> = ({ name, src, size = 40, className }) => {
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    const colors = [
        'bg-blue-100 text-blue-600',
        'bg-green-100 text-green-600',
        'bg-purple-100 text-purple-600',
        'bg-orange-100 text-orange-600',
        'bg-pink-100 text-pink-600',
        'bg-indigo-100 text-indigo-600',
    ];

    const colorIndex = name.length % colors.length;
    const colorClass = colors[colorIndex];

    return (
        <div 
            className={clsx(
                "rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm",
                !src && colorClass,
                className
            )}
            style={{ width: size, height: size }}
        >
            {src ? (
                <img src={src} alt={name} className="w-full h-full object-cover" />
            ) : (
                <span className="font-bold tracking-tighter" style={{ fontSize: size * 0.4 }}>
                    {getInitials(name)}
                </span>
            )}
        </div>
    );
};

export const LeaderboardPage: React.FC = () => {
    const [copied, setCopied] = useState(false);
    const { user: currentUser } = useAuth();

    const leaderboardData: LeaderboardUser[] = [
        { rank: 1, name: 'EcoWarrior_22', points: 4850, avatar: null },
        { rank: 2, name: 'GreenLife', points: 4210, avatar: null },
        { rank: 3, name: 'SustainQueen', points: 3980, avatar: null },
        { rank: 4, name: 'ForestGuardian', points: 3750, avatar: null },
        { rank: 5, name: 'RecycleKing', points: 3420, avatar: null },
    ];

    // Ensure current user is in the list
    const isUserInTop5 = leaderboardData.some(u => u.name === currentUser?.name);
    const displayData = [...leaderboardData];
    if (!isUserInTop5 && currentUser) {
        displayData.push({
            rank: 42,
            name: currentUser.name,
            points: currentUser.points,
            avatar: currentUser.avatar || null
        });
    }

    const podiumOrder = [1, 0, 2]; // Rank indices: 2, 1, 3

    const handleInvite = () => {
        const inviteLink = `https://grinify.app/invite?ref=user_${Math.random().toString(36).substr(2, 9)}`;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12 pb-16 px-4">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <h1 className="text-4xl font-black text-text tracking-tight uppercase">Leaderboard</h1>
                <p className="text-text-light mt-3 text-lg">Top contributors in our green revolution.</p>
            </motion.div>

            {/* Podium Section */}
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-4 pt-10">
                {podiumOrder.map((idx) => {
                    const user = leaderboardData[idx];
                    if (!user) return null;
                    const isRank1 = user.rank === 1;
                    const isRank2 = user.rank === 2;
                    const isRank3 = user.rank === 3;

                    return (
                        <motion.div
                            key={user.name}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, delay: 0.2 + idx * 0.1 }}
                            className={clsx(
                                "flex flex-col items-center w-full md:w-64 p-6 rounded-[2.5rem] relative shadow-soft border transition-all hover:scale-[1.02] duration-300",
                                isRank1 ? "bg-white border-yellow-200 z-10 md:-translate-y-8" : "bg-white/80 border-gray-100"
                            )}
                        >
                            {isRank1 && (
                                <div className="absolute -top-10">
                                    <motion.div
                                        animate={{ y: [0, -8, 0], rotate: [0, 5, -5, 0] }}
                                        transition={{ duration: 3, repeat: Infinity }}
                                    >
                                        <Crown className="w-14 h-14 text-yellow-500 fill-yellow-500 filter drop-shadow-md" />
                                    </motion.div>
                                </div>
                            )}

                            <div className="relative">
                                <Avatar 
                                    name={user.name} 
                                    src={user.avatar} 
                                    size={isRank1 ? 100 : 80} 
                                    className={clsx(
                                        "ring-4",
                                        isRank1 ? "ring-yellow-400" : 
                                        isRank2 ? "ring-gray-300" : 
                                        "ring-amber-600/40"
                                    )}
                                />
                                <div className={clsx(
                                    "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-lg",
                                    isRank1 ? "bg-yellow-400" : 
                                    isRank2 ? "bg-gray-300 text-gray-700" : 
                                    "bg-amber-600"
                                )}>
                                    {user.rank}
                                </div>
                            </div>

                            <h3 className={clsx("mt-6 font-bold truncate w-full text-center", isRank1 ? "text-xl" : "text-lg")}>
                                {user.name}
                            </h3>
                            
                            <div className="mt-2 flex items-center gap-1.5 py-1 px-4 bg-primary/10 rounded-full">
                                <Trophy className="w-4 h-4 text-primary" />
                                <span className="font-black text-primary">{user.points.toLocaleString()}</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* List Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-[2rem] shadow-soft border border-gray-100 overflow-hidden"
            >
                <div className="px-8 py-5 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center text-xs font-bold uppercase tracking-widest text-text-light">
                    <div className="flex items-center gap-12">
                        <span className="w-8">Rank</span>
                        <span>Warrior</span>
                    </div>
                    <span>Points</span>
                </div>

                <div className="divide-y divide-gray-50">
                    {displayData.slice(3).map((user, index) => {
                        const isMe = user.name === currentUser?.name;
                        return (
                            <motion.div
                                key={user.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + index * 0.05 }}
                                className={clsx(
                                    "flex items-center justify-between px-8 py-4 transition-all hover:bg-gray-50 group",
                                    isMe ? "bg-green-50/80" : ""
                                )}
                            >
                                <div className="flex items-center gap-10">
                                    <span className="font-black text-gray-300 group-hover:text-text-light transition-colors w-8 text-lg">
                                        {user.rank}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <Avatar name={user.name} src={user.avatar} size={48} />
                                        <span className={clsx(
                                            "font-bold text-lg",
                                            isMe ? "text-green-700" : "text-text"
                                        )}>
                                            {user.name}
                                            {isMe && <span className="ml-2 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">(You)</span>}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="bg-primary/5 p-2 rounded-xl">
                                        <Medal className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="font-black text-xl text-text">{user.points.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Invite Section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 }}
                className="bg-gradient-to-r from-primary to-primary-dark rounded-[2.5rem] p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl relative overflow-hidden group"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:scale-110 transition-transform duration-700" />
                
                <div className="relative z-10 text-center md:text-left">
                    <h2 className="text-3xl font-black">Bring your squad! 🌿</h2>
                    <p className="opacity-90 mt-2 text-lg">Earn +500 points for every friend who joins.</p>
                </div>

                <button
                    onClick={handleInvite}
                    className={clsx(
                        "relative z-10 flex items-center gap-3 px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-2xl active:scale-95",
                        copied ? "bg-green-400 text-white" : "bg-white text-primary hover:bg-gray-50"
                    )}
                >
                    {copied ? (
                        <>
                            <Check className="w-6 h-6" />
                            <span>COPIED!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-6 h-6" />
                            <span>INVITE FRIENDS</span>
                        </>
                    )}
                </button>
            </motion.div>
        </div>
    );
};
