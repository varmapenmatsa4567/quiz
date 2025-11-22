"use client";
import React from "react";

export function Slider({
    min = 0,
    max = 100,
    step = 1,
    value,
    onChange,
    className = "",
    ...props
}) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className={`relative w-full h-6 flex items-center ${className}`}>
            {/* Track Background */}
            <div className="absolute w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                {/* Fill */}
                <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-150 ease-out"
                    style={{ width: `${percentage}%` }}
                />
            </div>

            {/* Input Range */}
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={onChange}
                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                {...props}
            />

            {/* Custom Thumb (Visual Only - follows the percentage) */}
            <div
                className="absolute h-5 w-5 bg-white rounded-full shadow-lg shadow-primary/50 border-2 border-primary transform -translate-x-1/2 pointer-events-none transition-all duration-150 ease-out"
                style={{ left: `${percentage}%` }}
            />
        </div>
    );
}
