import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Button({
    children,
    className,
    variant = "primary",
    size = "md",
    isLoading = false,
    disabled,
    ...props
}) {
    const baseStyles = "inline-flex items-center justify-center rounded-xl font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";

    const variants = {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-lg shadow-secondary/25",
        accent: "bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/25",
        ghost: "bg-transparent hover:bg-white/5 text-foreground",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/25",
        outline: "border-2 border-input bg-transparent hover:bg-accent hover:text-accent-foreground hover:border-accent",
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "p-3",
    };

    return (
        <button
            className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? (
                <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading...</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
}
