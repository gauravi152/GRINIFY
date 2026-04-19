import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Share2, Check } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../utils/apiClient';

interface LeaderboardUser {
    rank: number;
    name: string;
    points: number;
    scans: number;
    impact_level: string;
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
            style={{ width: size, height: size, flexShrink: 0 }}
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
    const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const result = await apiClient('/leaderboard');
                if (result.status === 'success' && Array.isArray(result.leaderboard)) {
                    setLeaderboardData(result.leaderboard);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard:", error);
            }
        };
        fetchLeaderboard();
        
        // Polling optionally to keep it fresh
        const interval = setInterval(fetchLeaderboard, 15000);
        return () => clearInterval(interval);
    }, []);

    // Ensure current user is in the list visually
    const isUserInList = leaderboardData.some(u => u.name === currentUser?.name);
    const displayData = [...leaderboardData];

if (!isUserInList && currentUser) {
  // Find their virtual rank based on points
  const virtualRank =
    displayData.filter(
      (u) => (u.points ?? 0) >= (currentUser?.points ?? 0)
    ).length + 1;

  displayData.push({
    rank: virtualRank,
    name: currentUser?.name ?? "Unknown",
    points: currentUser?.points ?? 0,
    scans: currentUser?.scans ?? 0,
  });
}

displayData.sort((a, b) => (b.points ?? 0) - (a.points ?? 0));

// re-rank
        displayData.forEach((u, i) => u.rank = i + 1);
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
                    const user = displayData[idx];
                    if (!user) return null;
                    const isRank1 = user.rank === 1;
                    const isRank2 = user.rank === 2;
                    const isRank3 = user.rank === 3;
                    const isMe = user.name === currentUser?.name;

                    let rankIcon = null;
                    if (isRank1) rankIcon = '🥇';
                    if (isRank2) rankIcon = '🥈';
                    if (isRank3) rankIcon = '🥉';

                    return (
                        <motion.div
                            key={user.name}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 100, delay: 0.2 + idx * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className={clsx(
                                "flex flex-col items-center w-full md:w-64 p-6 rounded-[2.5rem] relative shadow-soft border transition-all duration-300",
                                isRank1 ? "bg-gradient-to-b from-yellow-50 to-white border-yellow-300 shadow-yellow-100/50 shadow-xl z-10 md:-translate-y-8" : 
                                isRank2 ? "bg-gradient-to-b from-gray-50 to-white border-gray-300 shadow-gray-200/50 shadow-lg" : 
                                "bg-gradient-to-b from-orange-50 to-white border-orange-200 shadow-orange-100/50 shadow-lg",
                                isMe && "ring-4 ring-green-400"
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
                                        "ring-amber-500"
                                    )}
                                />
                                <div className={clsx(
                                    "absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-black text-white shadow-lg text-lg",
                                    isRank1 ? "bg-yellow-400" : 
                                    isRank2 ? "bg-gray-400" : 
                                    "bg-amber-500"
                                )}>
                                    #{user.rank}
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-6">
                                <h3 className={clsx("font-bold truncate text-center", isRank1 ? "text-xl" : "text-lg")}>
                                    {user.name}
                                </h3>
                                {isMe && <span className="bg-green-100 text-green-600 text-xs font-bold px-2 py-0.5 rounded-full">You</span>}
                            </div>
                            
                            <div className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mt-1 mb-1">
                                {user.impact_level}
                            </div>
                            <div className="text-xs text-text-light font-medium mb-3 flex items-center gap-1">
                                <span>{user.scans} Scans</span> 
                                <span className="text-xl">{rankIcon}</span>
                            </div>
                            
                            <div className="mt-auto flex items-center gap-1.5 py-1.5 px-5 bg-primary/10 rounded-full">
                                <Trophy className="w-4 h-4 text-primary" />
                                <span className="font-black text-primary text-lg">{user.points.toLocaleString()}</span>
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
                        <span className="w-12 text-center">Rank</span>
                        <span>Warrior</span>
                    </div>
                    <span>Score</span>
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
                                    "flex flex-col sm:flex-row items-start sm:items-center justify-between px-8 py-6 transition-all hover:bg-gray-50 group",
                                    isMe ? "bg-green-50/70 shadow-inner" : ""
                                )}
                            >
                                <div className="flex items-center gap-8 w-full sm:w-auto">
                                    <span className="font-black text-gray-400 group-hover:text-primary transition-colors w-8 text-xl text-center">
                                        #{user.rank}
                                    </span>
                                    <div className="flex items-center gap-4">
                                        <Avatar name={user.name} src={user.avatar} size={50} />
                                        <div className="flex flex-col">
                                            <span className={clsx(
                                                "font-bold text-lg flex items-center gap-2",
                                                isMe ? "text-green-700" : "text-text"
                                            )}>
                                                {user.name}
                                                {isMe && <span className="text-xs font-bold text-green-600 bg-green-200/50 px-2.5 py-0.5 rounded-full uppercase tracking-wide">You</span>}
                                            </span>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">{user.impact_level}</span>
                                                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                                    • {user.scans} items scanned
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-4 sm:mt-0 self-end sm:self-auto bg-gray-50/80 px-4 py-2 rounded-2xl group-hover:bg-white transition-colors border border-transparent group-hover:border-gray-100 group-hover:shadow-sm">
                                    <div className="bg-primary/10 p-2 rounded-xl">
                                        <Medal className="w-5 h-5 text-primary" />
                                    </div>
                                    <span className="font-black text-2xl text-text tracking-tight">{user.points.toLocaleString()}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                    {displayData.slice(3).length === 0 && (
                        <div className="py-12 text-center text-text-light font-medium">
                            No other warriors found. Keep scanning to invite others!
                        </div>
                    )}
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
