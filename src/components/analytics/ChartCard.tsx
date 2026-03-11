import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ChartCardProps {
    title: string;
    children: React.ReactNode;
    className?: string;
    height?: number | string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    children,
    className,
    height = 300
}) => {
    return (
        <div className={twMerge(clsx("bg-white p-6 rounded-2xl shadow-sm border border-gray-100", className))}>
            <h3 className="text-lg font-bold text-gray-800 mb-6">{title}</h3>
            <div style={{ height }} className="w-full">
                {children}
            </div>
        </div>
    );
};
