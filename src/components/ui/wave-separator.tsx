import React from 'react';

interface WaveSeparatorProps {
    position?: 'top' | 'bottom';
    color?: string;
    className?: string;
}

export function WaveSeparator({
    position = 'bottom',
    color = 'fill-white',
    className = ''
}: WaveSeparatorProps) {
    const isTop = position === 'top';

    return (
        <div className={`absolute left-0 w-full overflow-hidden leading-none z-10 ${isTop ? 'top-0 rotate-180' : 'bottom-0'} ${className}`}>
            <svg
                className={`relative block w-[calc(140%+1.3px)] h-[100px] ${color}`}
                data-name="Layer 1"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 1200 120"
                preserveAspectRatio="none"
            >
                <path d="M985.66,92.83C906.67,72,823.78,31,433.86,8c-291.77-17.2-283.49,69-433.86,92V120h1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z"></path>
            </svg>
        </div>
    );
}
