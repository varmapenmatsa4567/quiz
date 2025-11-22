import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Textarea({ className, ...props }) {
    return (
        <textarea
            className={twMerge(
                clsx(
                    "w-full bg-input text-foreground border border-transparent rounded-xl px-4 py-3",
                    "placeholder:text-gray-400",
                    "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    "transition-all duration-200",
                    "min-h-[100px] resize-y",
                    className
                )
            )}
            {...props}
        />
    );
}
