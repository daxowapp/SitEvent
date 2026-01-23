import { useState, useEffect } from 'react';

interface LocationState {
    country: string;
    city: string;
    loading: boolean;
    error: string | null;
}

export function useGeolocation() {
    const [location, setLocation] = useState<LocationState>({
        country: '',
        city: '',
        loading: true,
        error: null,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, loading: false, error: 'Geolocation not supported' }));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    // Using BigDataCloud free reverse geocoding API (no key needed for client-side)
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    const data = await res.json();

                    setLocation({
                        country: data.countryName || '',
                        city: data.city || data.locality || '',
                        loading: false,
                        error: null,
                    });
                } catch (error) {
                    setLocation(prev => ({ ...prev, loading: false, error: 'Failed to fetch location data' }));
                }
            },
            (error) => {
                setLocation(prev => ({ ...prev, loading: false, error: error.message }));
            }
        );
    }, []);

    return location;
}
