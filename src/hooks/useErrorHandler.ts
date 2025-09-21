import { useState, useCallback } from 'react';

export interface AppError {
    message: string;
    code?: string;
    timestamp: Date;
}

export const useErrorHandler = () => {
    const [error, setError] = useState<AppError | null>(null);

    const handleError = useCallback((error: Error | string, code?: string) => {
        const errorMessage = typeof error === 'string' ? error : error.message;

        const appError: AppError = {
            message: errorMessage,
            code,
            timestamp: new Date()
        };

        setError(appError);

        // Log to console for development
        console.error('App Error:', appError);

        // TODO: Could integrate with Sentry here
        // Sentry.captureException(error);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const handleApiError = useCallback((response: Response, customMessage?: string) => {
        const message = customMessage || `API Error: ${response.status} ${response.statusText}`;
        handleError(message, response.status.toString());
    }, [handleError]);

    const handleNetworkError = useCallback((error: Error) => {
        const message = error.message.includes('fetch')
            ? 'Network error. Please check your connection.'
            : error.message;
        handleError(message, 'NETWORK_ERROR');
    }, [handleError]);

    return {
        error,
        handleError,
        clearError,
        handleApiError,
        handleNetworkError,
        hasError: error !== null
    };
};