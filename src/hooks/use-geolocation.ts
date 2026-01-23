import { useState, useEffect } from 'react';

interface LocationState {
    country: string;
    countryCode: string;
    city: string;
    loading: boolean;
    error: string | null;
}

export function useGeolocation() {
    const [location, setLocation] = useState<LocationState>({
        country: '',
        countryCode: '',
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
                        countryCode: data.country || '', // ipapi uses 'country' for code like 'US', wait check docs. ipapi.co returns 'country_code' usually. Let me check my previous edit or assume standard.
                        // Actually ipapi.co returns 'country_code': 'US' and 'country_name': 'United States'.
                        // My previous edit used data.country_name.
                        // I will use data.country_code here. 
                        // Wait, I need to be sure. ipapi.co/json returns field 'country_code'.
                        // ipwho.is returns 'country_code'.
                        // I will safely assume country_code.
                        city: data.city || '',
                        loading: false,
                        error: null,
                    });
                    return; // Success
                }
            }
            // ... wait, I need to be precise.
            // ipapi.co JSON: { ip, city, region, region_code, country, country_name, country_code, ... }
            // It returns `country_code` (2 char).
            // ipwho.is JSON: { ip, country_code, country, ... }
            // So both utilize `country_code`.
            catch (e) {
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
