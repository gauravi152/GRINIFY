import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    color?: 'primary' | 'secondary' | 'accent' | 'blue';
    className?: string;
    delay?: number;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'primary',
    className,
    delay = 0,
}) => {
    const colorMap = {
        primary: 'bg-primary/10 text-primary',
        secondary: 'bg-secondary/20 text-green-600',
        accent: 'bg-orange-100 text-orange-600',
        blue: 'bg-blue-100 text-blue-600',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
            className={twMerge(clsx("bg-white p-6 rounded-2xl shadow-sm border border-gray-100", className))}
        >
            <div className="flex items-center justify-between mb-4">
                <div className={clsx("p-3 rounded-xl", colorMap[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={clsx("flex items-center text-sm font-medium", trend.isPositive ? "text-green-500" : "text-red-500")}>
                        {trend.isPositive ? "+" : "-"}{Math.abs(trend.value)}%
                    </div>
                )}
            </div>

            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </motion.div>
    );
};
