import { useEffect, useState } from 'react';

export function useNow() {
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const update = () => setNow(Date.now());
        const interval = window.setInterval(update, 1000);
        document.addEventListener('visibilitychange', update);
        return () => {
            window.clearInterval(interval);
            document.removeEventListener('visibilitychange', update);
        };
    }, []);
    return now;
}
