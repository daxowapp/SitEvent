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
        const detectLocation = async () => {
            try {
                // Primary: Try IP-based detection (seamless, no permission needed)
                const res = await fetch('https://ipapi.co/json/');
                if (res.ok) {
                    const data = await res.json();
                    setLocation({
                        country: data.country_name || '',
                        city: data.city || '',
                        loading: false,
                        error: null,
                    });
                    return; // Success
                }
            } catch (e) {
                // Fallback to second API if first fails (e.g. adblocker)
                try {
                    const res2 = await fetch('https://ipwho.is/');
                    if (res2.ok) {
                        const data = await res2.json();
                        setLocation({
                            country: data.country || '',
                            city: data.city || '',
                            loading: false,
                            error: null,
                        });
                        return;
                    }
                } catch (e2) {
                    console.error("Auto-location failed");
                }
            }

            // Final state if detection fails
            setLocation(prev => ({ ...prev, loading: false }));
        };

        detectLocation();
    }, []);

    return location;
}
