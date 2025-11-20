import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Card({ children, className, glass = false, hoverEffect = false, ...props }) {
    return (
        <div
            className={twMerge(
                clsx(
                    "rounded-2xl p-6 transition-all duration-300",
                    glass ? "glass" : "bg-card text-card-foreground border border-white/5",
                    hoverEffect && "hover:scale-[1.02] hover:shadow-xl hover:border-primary/50",
                    className
                )
            )}
            {...props}
        >
            {children}
        </div>
    );
}
