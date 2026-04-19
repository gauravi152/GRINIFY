import React, { useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import { StatCard } from '../components/dashboard/StatCard';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { ChallengesWidget } from '../components/dashboard/ChallengesWidget';
import { Leaf, Award, Recycle, TrendingUp, ArrowRight, Check, Share2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';

// Animations
const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [copied, setCopied] = useState(false);

    const handleInvite = () => {
        const inviteLink = `https://grinify.app/invite?ref=${user?.name?.toLowerCase().replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 5)}`;
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 pb-10"
        >
            {/* Welcome Section */}
            <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text tracking-tight">Hello, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="text-text-light mt-1">Ready to make the world a little greener today?</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleInvite}
                        className={clsx(
                            "bg-white border-gray-200 transition-all",
                            copied ? "text-green-600 border-green-200 bg-green-50" : ""
                        )}
                    >
                        {copied ? (
                            <><Check className="mr-2 w-4 h-4" /> Copied!</>
                        ) : (
                            <><Share2 className="mr-2 w-4 h-4" /> Invite Friend</>
                        )}
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => navigate('/scan')}
                        className="bg-primary text-white shadow-lg shadow-primary/20 btn-hover"
                    >
                        Scan Waste <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Points"
                    value={user?.points?.toLocaleString() || "0"}
                    icon={Leaf}
                    color="primary"
                    trend={{ value: 12, isPositive: true }}
                    delay={0.1}
                />
                <StatCard
                    title="Waste Scanned"
                    value={user?.scans?.toString() || "0"}
                    icon={Recycle}
                    color="blue"
                    trend={{ value: 5, isPositive: true }}
                    delay={0.2}
                />
                <StatCard
                    title="Recycling Rate"
                    value="85%"
                    icon={TrendingUp}
                    color="secondary"
                    trend={{ value: 2, isPositive: true }}
                    delay={0.3}
                />
                <StatCard
                    title="Current Rank"
                    value={user?.rank || "#--"}
                    icon={Award}
                    color="accent"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Progress/Summary Area (2 columns) */}
                <motion.div variants={itemVariants} className="lg:col-span-2 space-y-8">
                    {/* Eco Impact Card */}
                    <div className="bg-gradient-to-br from-primary to-[#7B8D4F] rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-primary/30 group">
                        <div className="relative z-10 transition-transform duration-500 group-hover:-translate-y-1">
                            <h2 className="text-2xl font-bold mb-2 tracking-tight">Today's Eco Impact</h2>
                            <p className="opacity-90 mb-8 max-w-md bg-black/10 p-2 rounded-lg backdrop-blur-sm">
                                You've saved the equivalent of 3.2kg of CO2 today by sorting your waste correctly. Keep it up!
                            </p>

                            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 max-w-sm border border-white/10">
                                <div className="flex justify-between text-sm font-bold mb-2">
                                    <span>Daily Goal</span>
                                    <span>80%</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-3 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '80%' }}
                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                                        className="bg-white h-full rounded-full relative"
                                    >
                                        <div className="absolute inset-0 bg-white/30 animate-pulse-slow"></div>
                                    </motion.div>
                                </div>
                                <p className="text-xs mt-3 opacity-90 font-medium">50 more points to reach the "Eco Warrior" badge!</p>
                            </div>
                        </div>

                        {/* Decorative Elements */}
                        <Leaf className="absolute right-[-20px] bottom-[-20px] w-56 h-56 text-white/10 rotate-12 transition-transform duration-700 group-hover:rotate-[20deg] group-hover:scale-110" />
                        <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                    </div>

                    {/* Challenges Section */}
                    <ChallengesWidget />
                </motion.div>

                {/* Right Sidebar (1 column) */}
                <motion.div variants={itemVariants} className="space-y-8">
                    <ActivityFeed />

                    {/* Next Reward Badge Preview */}
                    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 flex flex-col items-center text-center card-hover">
                        <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mb-4 relative">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 border-2 border-dashed border-secondary rounded-full opacity-50"
                            />
                            <Award className="w-10 h-10 text-secondary" />
                        </div>
                        <h3 className="font-bold text-text">Next Reward</h3>
                        <p className="text-text-light text-sm mt-1 mb-4">Recycling Pro Badge</p>
                        <div className="w-full bg-gray-100 rounded-full h-2 mb-2 overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: '65%' }}
                                transition={{ duration: 1, delay: 0.8 }}
                                className="bg-secondary h-full rounded-full"
                            />
                        </div>
                        <p className="text-xs text-text-light mt-1">350/500 points to unlock</p>
                    </div>
                </motion.div>
            </div>
        </motion.div >
    );
};
