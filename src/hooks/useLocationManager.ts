import { useCallback, useEffect } from 'react';
import { TEST_COORDS } from '@/config.js';

interface UseLocationManagerProps {
    onLocationSuccess: (
        latitude: number,
        longitude: number,
        isRefresh?: boolean
    ) => void;
    onStatusChange: (status: string) => void;
}

export const useLocationManager = ({
    onLocationSuccess,
    onStatusChange,
}: UseLocationManagerProps) => {
    const checkLocationPermission = useCallback(async () => {
        if (!navigator.permissions) {
            return null;
        }

        try {
            const permission = await navigator.permissions.query({
                name: 'geolocation',
            });
            return permission.state;
        } catch (error) {
            console.warn('Could not query geolocation permission:', error);
            return null;
        }
    }, []);

    const getUserLocationAndFetch = useCallback(
        (isRefresh = false) => {
            if (!navigator.geolocation) {
                onStatusChange('Geolocation is not supported by your browser.');
                return;
            }

            const options = {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 0,
            };

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    console.warn(
                        'useLocationManager: using user location (position.coords)'
                    );
                    onLocationSuccess(latitude, longitude, isRefresh);
                },
                (error) => {
                    console.warn('Geolocation error:', error.message);
                    onStatusChange('Unable to retrieve your location.');
                    console.warn(
                        'useLocationManager: using TEST_COORDS (navigator.geolocation failed)'
                    );
                    onLocationSuccess(
                        TEST_COORDS.lat,
                        TEST_COORDS.lon,
                        isRefresh
                    );
                },
                options
            );
        },
        [onLocationSuccess, onStatusChange]
    );

    useEffect(() => {
        const initializeLocation = async () => {
            const permissionState = await checkLocationPermission();

            if (permissionState === 'granted') {
                onStatusChange('Location access granted');
                getUserLocationAndFetch();
            } else if (permissionState === 'denied') {
                onStatusChange(
                    'Location access denied - using default location'
                );
                onLocationSuccess(TEST_COORDS.lat, TEST_COORDS.lon);
            } else {
                getUserLocationAndFetch();
            }
        };

        initializeLocation();

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('App became visible - refreshing location');
                initializeLocation();
            }
        };

        const handleFocus = () => {
            console.log('App focused - refreshing location');
            initializeLocation();
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener(
                'visibilitychange',
                handleVisibilityChange
            );
            window.removeEventListener('focus', handleFocus);
        };
    }, [
        getUserLocationAndFetch,
        checkLocationPermission,
        onLocationSuccess,
        onStatusChange,
    ]);

    return { getUserLocationAndFetch };
};
