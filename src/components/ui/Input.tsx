import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={twMerge(
                        clsx(
                            "w-full rounded-xl border border-gray-200 px-4 py-2.5 bg-gray-50 text-text transition-all duration-200 focus:outline-none focus:ring-2 disabled:bg-gray-100 disabled:cursor-not-allowed",
                            error
                                ? "border-red-300 focus:border-red-500 focus:ring-red-200"
                                : "focus:border-primary focus:ring-secondary/50",
                            className
                        )
                    )}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-500 font-medium">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
