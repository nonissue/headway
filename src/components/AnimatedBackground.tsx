export const AnimatedBackground = () => {
    return (
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
            {/* Lightweight animated line networks */}
            <div className="absolute inset-0 h-full w-full opacity-15">
                {/* Horizontal flowing lines */}
                <div className="absolute top-20 h-64 w-full rotate-12 animate-[slide-right_9s_linear_infinite] bg-gradient-to-r from-transparent via-muted-foreground/90 to-transparent"></div>
                <div className="absolute top-32 h-96 w-full -rotate-6 animate-[slide-left_12s_linear_infinite] bg-gradient-to-r from-transparent via-ring/30 to-transparent"></div>
                <div
                    className="absolute top-44 h-48 w-full rotate-3 animate-[slide-right_10.5s_linear_infinite] bg-gradient-to-r from-transparent via-border/50 to-transparent"
                    style={{ animationDelay: '2s' }}
                ></div>

                <div className="absolute top-1/2 h-[48rem] w-full rotate-45 animate-[slide-left_30s_linear_infinite] bg-gradient-to-r from-transparent via-muted-foreground/90 to-transparent"></div>
                <div
                    className="absolute bottom-44 h-80 w-full -rotate-8 animate-[slide-right_7.5s_linear_infinite] bg-gradient-to-r from-transparent via-ring/40 to-transparent"
                    style={{ animationDelay: '1s' }}
                ></div>
                <div
                    className="absolute bottom-32 h-32 w-full rotate-15 animate-[slide-left_10.5s_linear_infinite] bg-gradient-to-r from-transparent via-border/35 to-transparent"
                    style={{ animationDelay: '3s' }}
                ></div>
                <div
                    className="absolute bottom-20 h-[32rem] w-full -rotate-2 animate-[slide-right_9s_linear_infinite] bg-gradient-to-r from-transparent via-muted-foreground/45 to-transparent"
                    style={{ animationDelay: '4s' }}
                ></div>

                {/* Vertical flowing lines */}
                <div className="absolute left-20 h-full w-48 rotate-90 animate-[slide-down_15s_linear_infinite] bg-gradient-to-b from-transparent via-border/30 to-transparent"></div>
                <div
                    className="absolute right-20 h-full w-64 -rotate-90 animate-[slide-up_12s_linear_infinite] bg-gradient-to-b from-transparent via-ring/25 to-transparent"
                    style={{ animationDelay: '2s' }}
                ></div>
                <div
                    className="absolute left-1/3 h-full w-32 rotate-75 animate-[slide-down_18s_linear_infinite] bg-gradient-to-b from-transparent via-muted-foreground/20 to-transparent"
                    style={{ animationDelay: '1s' }}
                ></div>
                <div
                    className="absolute right-1/3 h-full w-80 -rotate-105 animate-[slide-up_13.5s_linear_infinite] bg-gradient-to-b from-transparent via-border/40 to-transparent"
                    style={{ animationDelay: '3s' }}
                ></div>
            </div>

            {/* Subtle grid overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--muted-foreground)/0.02)_1px,transparent_1px)] bg-[length:64px_64px] opacity-30"></div>
        </div>
    );
};