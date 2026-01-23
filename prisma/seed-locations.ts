import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLocations() {
    console.log('🌍 Seeding countries and cities...');

    // Define countries with cities
    const countriesData = [
        {
            name: 'Egypt',
            code: 'EG',
            flagEmoji: '🇪🇬',
            timezone: 'Africa/Cairo',
            cities: [
                {
                    name: 'Cairo',
                    description: 'The capital of Egypt, a sprawling metropolis on the Nile River, known for the nearby Pyramids of Giza and the Sphinx.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1572252009286-268acec5ca0a?w=1200',
                    attractions: [
                        { name: 'Pyramids of Giza', description: 'Ancient wonder of the world', mapUrl: 'https://maps.google.com/?q=Pyramids+of+Giza' },
                        { name: 'Egyptian Museum', description: 'Home to the treasures of Tutankhamun', mapUrl: 'https://maps.google.com/?q=Egyptian+Museum+Cairo' },
                        { name: 'Khan el-Khalili Bazaar', description: 'Historic marketplace dating back to 1382', mapUrl: 'https://maps.google.com/?q=Khan+el-Khalili' },
                    ],
                    cafesAndFood: [
                        { name: 'Abou El Sid', cuisine: 'Egyptian', priceRange: '$$', address: 'Zamalek' },
                        { name: 'Café Riche', cuisine: 'Egyptian/French', priceRange: '$$', address: 'Downtown Cairo' },
                    ],
                    transportation: {
                        airport: 'Cairo International Airport (CAI) - 20km from city center. Taxi to downtown ~30-45 mins.',
                        metro: '3 metro lines cover major areas. Line 2 connects airport. Tickets: 5-10 EGP.',
                        taxi: 'Use Uber or Careem apps for reliable, metered rides. Yellow taxis require negotiation.',
                        tips: 'Traffic is heavy, especially during rush hours. Allow extra time for travel.',
                    },
                    localTips: 'Best time to visit: October to April. Dress modestly when visiting religious sites. Bargaining is expected at markets.',
                    emergencyInfo: 'Emergency: 123 | Tourist Police: 126 | Ambulance: 123',
                },
                {
                    name: 'Alexandria',
                    description: 'Historic Mediterranean port city, founded by Alexander the Great in 331 BC.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1609789830889-7bbb7e7d4cd3?w=1200',
                    attractions: [
                        { name: 'Bibliotheca Alexandrina', description: 'Modern library commemorating the ancient Library of Alexandria', mapUrl: 'https://maps.google.com/?q=Bibliotheca+Alexandrina' },
                        { name: 'Qaitbay Citadel', description: '15th-century fortress on the Mediterranean coast', mapUrl: 'https://maps.google.com/?q=Qaitbay+Citadel' },
                    ],
                    cafesAndFood: [
                        { name: 'Fish Market', cuisine: 'Seafood', priceRange: '$$$', address: 'Corniche' },
                    ],
                    transportation: {
                        airport: 'Borg El Arab Airport (HBE) - 40km from city center.',
                        metro: 'No metro. Use buses or microbuses.',
                        taxi: 'Uber and Careem available. Traditional yellow taxis require negotiation.',
                        tips: 'The Corniche is great for walking along the Mediterranean.',
                    },
                    localTips: 'Famous for its seafood restaurants along the Corniche. Summer is crowded with Egyptian tourists.',
                    emergencyInfo: 'Emergency: 123 | Tourist Police: 126',
                },
            ],
        },
        {
            name: 'Algeria',
            code: 'DZ',
            flagEmoji: '🇩🇿',
            timezone: 'Africa/Algiers',
            cities: [
                {
                    name: 'Algiers',
                    description: 'The capital and largest city of Algeria, known as "Algiers the White" for its gleaming white buildings.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1583866908906-c73db3d0eee4?w=1200',
                    attractions: [
                        { name: 'Casbah of Algiers', description: 'UNESCO World Heritage Site with Ottoman-era architecture', mapUrl: 'https://maps.google.com/?q=Casbah+Algiers' },
                        { name: 'Notre Dame d\'Afrique', description: 'Roman Catholic basilica overlooking the Bay of Algiers', mapUrl: 'https://maps.google.com/?q=Notre+Dame+Afrique+Algiers' },
                    ],
                    cafesAndFood: [
                        { name: 'El Djazair Hotel Restaurant', cuisine: 'Algerian/French', priceRange: '$$$', address: 'Hydra' },
                    ],
                    transportation: {
                        airport: 'Houari Boumediene Airport (ALG) - 20km from city center.',
                        metro: 'Algiers Metro has 1 line connecting suburbs to downtown.',
                        taxi: 'Official taxis are white. Use metered taxis or negotiate upfront.',
                        tips: 'French is widely spoken. Traffic can be congested.',
                    },
                    localTips: 'Visit the Casbah early morning to avoid crowds. Arabic and French are official languages.',
                    emergencyInfo: 'Emergency: 17 | Ambulance: 14 | Fire: 14',
                },
            ],
        },
        {
            name: 'France',
            code: 'FR',
            flagEmoji: '🇫🇷',
            timezone: 'Europe/Paris',
            cities: [
                {
                    name: 'Paris',
                    description: 'The City of Light, France\'s capital, famous for the Eiffel Tower, art museums, and café culture.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200',
                    attractions: [
                        { name: 'Eiffel Tower', description: 'Iconic iron lattice tower, symbol of Paris', mapUrl: 'https://maps.google.com/?q=Eiffel+Tower' },
                        { name: 'Louvre Museum', description: 'World\'s largest art museum, home of the Mona Lisa', mapUrl: 'https://maps.google.com/?q=Louvre+Museum' },
                        { name: 'Notre-Dame Cathedral', description: 'Medieval Catholic cathedral (under restoration)', mapUrl: 'https://maps.google.com/?q=Notre-Dame+Paris' },
                    ],
                    cafesAndFood: [
                        { name: 'Café de Flore', cuisine: 'French', priceRange: '$$$', address: 'Saint-Germain-des-Prés' },
                        { name: 'Le Comptoir du Panthéon', cuisine: 'French', priceRange: '$$', address: 'Latin Quarter' },
                    ],
                    transportation: {
                        airport: 'Charles de Gaulle (CDG) - 25km. RER B train to city ~35 mins. Orly (ORY) - 14km south.',
                        metro: 'Extensive metro network with 16 lines. Buy Navigo pass for unlimited travel.',
                        taxi: 'Official taxis are marked. Uber available but more expensive than metro.',
                        tips: 'Buy Paris Visite pass for unlimited public transport. Walking is the best way to explore neighborhoods.',
                    },
                    localTips: 'Learn basic French phrases. Tipping is not mandatory but appreciated. Museums are free on first Sunday of month.',
                    emergencyInfo: 'Emergency: 112 | Police: 17 | Ambulance: 15',
                },
            ],
        },
        {
            name: 'Saudi Arabia',
            code: 'SA',
            flagEmoji: '🇸🇦',
            timezone: 'Asia/Riyadh',
            cities: [
                {
                    name: 'Riyadh',
                    description: 'The capital and largest city of Saudi Arabia, a blend of modernity and tradition.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?w=1200',
                    attractions: [
                        { name: 'Kingdom Centre Tower', description: 'Iconic skyscraper with sky bridge', mapUrl: 'https://maps.google.com/?q=Kingdom+Centre+Riyadh' },
                        { name: 'Diriyah', description: 'UNESCO World Heritage Site, birthplace of Saudi Arabia', mapUrl: 'https://maps.google.com/?q=Diriyah' },
                        { name: 'National Museum', description: 'Comprehensive museum of Saudi history', mapUrl: 'https://maps.google.com/?q=National+Museum+Riyadh' },
                    ],
                    cafesAndFood: [
                        { name: 'Najd Village', cuisine: 'Saudi', priceRange: '$$', address: 'Al Malaz' },
                        { name: 'Takya', cuisine: 'Modern Saudi', priceRange: '$$$', address: 'Diplomatic Quarter' },
                    ],
                    transportation: {
                        airport: 'King Khalid International Airport (RUH) - 35km from city center. Taxi ~30 mins.',
                        metro: 'Riyadh Metro (6 lines) opened recently. Still expanding coverage.',
                        taxi: 'Uber and Careem are widely used. Most reliable option.',
                        tips: 'Very hot in summer (up to 50°C). Most activity happens after sunset.',
                    },
                    localTips: 'Dress conservatively. Weekend is Friday-Saturday. Women no longer need abaya but modest dress expected.',
                    emergencyInfo: 'Emergency: 911 | Police: 999 | Ambulance: 997',
                },
                {
                    name: 'Jeddah',
                    description: 'Gateway to Mecca, historic Red Sea port with ancient coral buildings and modern development.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1200',
                    attractions: [
                        { name: 'Al-Balad', description: 'UNESCO-listed historic district with coral stone buildings', mapUrl: 'https://maps.google.com/?q=Al-Balad+Jeddah' },
                        { name: 'Jeddah Corniche', description: '30km waterfront promenade', mapUrl: 'https://maps.google.com/?q=Jeddah+Corniche' },
                        { name: 'King Fahd Fountain', description: 'Tallest fountain in the world', mapUrl: 'https://maps.google.com/?q=King+Fahd+Fountain' },
                    ],
                    cafesAndFood: [
                        { name: 'Al Nakheel', cuisine: 'Saudi/Lebanese', priceRange: '$$', address: 'Corniche' },
                    ],
                    transportation: {
                        airport: 'King Abdulaziz International Airport (JED) - 19km from city center.',
                        metro: 'No metro yet. Buses and taxis available.',
                        taxi: 'Uber and Careem widely available. Best transport option.',
                        tips: 'More relaxed atmosphere than Riyadh. Good for seaside walks.',
                    },
                    localTips: 'Visit Al-Balad in the evening when it\'s cooler. Friday mornings are quiet; shops open after Friday prayer.',
                    emergencyInfo: 'Emergency: 911 | Police: 999 | Ambulance: 997',
                },
            ],
        },
        {
            name: 'India',
            code: 'IN',
            flagEmoji: '🇮🇳',
            timezone: 'Asia/Kolkata',
            cities: [
                {
                    name: 'Pune',
                    description: 'Cultural capital of Maharashtra, known as the "Oxford of the East" for its educational institutions.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200',
                    attractions: [
                        { name: 'Shaniwar Wada', description: 'Historic fortification and seat of the Peshwa rulers', mapUrl: 'https://maps.google.com/?q=Shaniwar+Wada' },
                        { name: 'Aga Khan Palace', description: 'Historic building where Gandhi was imprisoned', mapUrl: 'https://maps.google.com/?q=Aga+Khan+Palace+Pune' },
                    ],
                    cafesAndFood: [
                        { name: 'German Bakery', cuisine: 'Cafe/International', priceRange: '$$', address: 'Koregaon Park' },
                        { name: 'Malaka Spice', cuisine: 'Asian Fusion', priceRange: '$$', address: 'Koregaon Park' },
                    ],
                    transportation: {
                        airport: 'Pune International Airport (PNQ) - 10km from city center.',
                        metro: 'Pune Metro is operational with 2 lines. Expanding network.',
                        taxi: 'Ola and Uber widely available. Auto-rickshaws for short trips.',
                        tips: 'Pleasant weather year-round. Known for IT sector and education.',
                    },
                    localTips: 'Best time to visit: October to February. Known for vada pav and misal pav local dishes.',
                    emergencyInfo: 'Emergency: 112 | Police: 100 | Ambulance: 108',
                },
            ],
        },
        {
            name: 'China',
            code: 'CN',
            flagEmoji: '🇨🇳',
            timezone: 'Asia/Shanghai',
            cities: [
                {
                    name: 'Beijing',
                    description: 'Capital of China, a vast city with 3,000 years of history and center of politics, culture, and education.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=1200',
                    attractions: [
                        { name: 'Forbidden City', description: 'Former imperial palace, UNESCO World Heritage Site', mapUrl: 'https://maps.google.com/?q=Forbidden+City+Beijing' },
                        { name: 'Great Wall of China', description: 'Ancient wall stretching thousands of kilometers', mapUrl: 'https://maps.google.com/?q=Great+Wall+Badaling' },
                        { name: 'Temple of Heaven', description: 'Imperial complex for religious ceremonies', mapUrl: 'https://maps.google.com/?q=Temple+of+Heaven' },
                    ],
                    cafesAndFood: [
                        { name: 'Dadong Roast Duck', cuisine: 'Chinese/Peking Duck', priceRange: '$$$', address: 'Chaoyang' },
                        { name: 'Baoyuan Dumplings', cuisine: 'Chinese Dumplings', priceRange: '$', address: 'Maizidian' },
                    ],
                    transportation: {
                        airport: 'Beijing Capital Airport (PEK) - 25km. Daxing Airport (PKX) - 46km south. Airport Express to city.',
                        metro: 'Extensive subway with 20+ lines. DiDi app for taxis.',
                        taxi: 'DiDi is the local Uber. Cash or WeChat Pay accepted.',
                        tips: 'Download VPN before arriving. WeChat and Alipay are essential for payments.',
                    },
                    localTips: 'Best time: September-October (clear skies). Air quality can vary. VPN needed for Google/Facebook.',
                    emergencyInfo: 'Police: 110 | Ambulance: 120 | Fire: 119',
                },
            ],
        },
        {
            name: 'Tunisia',
            code: 'TN',
            flagEmoji: '🇹🇳',
            timezone: 'Africa/Tunis',
            cities: [
                {
                    name: 'Tunis',
                    description: 'Capital of Tunisia, blending Arab medina with French colonial architecture.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1590686715496-e9b8f38ed3f5?w=1200',
                    attractions: [
                        { name: 'Medina of Tunis', description: 'UNESCO World Heritage Site with 700 monuments', mapUrl: 'https://maps.google.com/?q=Medina+of+Tunis' },
                        { name: 'Bardo Museum', description: 'World\'s largest collection of Roman mosaics', mapUrl: 'https://maps.google.com/?q=Bardo+Museum+Tunis' },
                        { name: 'Carthage', description: 'Ancient Phoenician city ruins', mapUrl: 'https://maps.google.com/?q=Carthage+Tunisia' },
                    ],
                    cafesAndFood: [
                        { name: 'Dar El Jeld', cuisine: 'Tunisian', priceRange: '$$$', address: 'Medina' },
                        { name: 'Café Saf Saf', cuisine: 'Cafe', priceRange: '$', address: 'La Marsa' },
                    ],
                    transportation: {
                        airport: 'Tunis-Carthage International Airport (TUN) - 8km from city center.',
                        metro: 'TGM light rail connects city to coastal suburbs.',
                        taxi: 'Yellow taxis with meters. Negotiate for longer trips.',
                        tips: 'French widely spoken. Tunisian dinar cannot be exported.',
                    },
                    localTips: 'Visit the Medina in the morning. Friday afternoons many shops close. Couscous is traditionally served on Fridays.',
                    emergencyInfo: 'Emergency: 197 | Police: 197 | Ambulance: 190',
                },
            ],
        },
        {
            name: 'Malaysia',
            code: 'MY',
            flagEmoji: '🇲🇾',
            timezone: 'Asia/Kuala_Lumpur',
            cities: [
                {
                    name: 'Kuala Lumpur',
                    description: 'Capital of Malaysia, famous for the iconic Petronas Twin Towers and diverse culture.',
                    bannerImageUrl: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1200',
                    attractions: [
                        { name: 'Petronas Twin Towers', description: 'Iconic 88-story twin skyscrapers', mapUrl: 'https://maps.google.com/?q=Petronas+Twin+Towers' },
                        { name: 'Batu Caves', description: 'Hindu temple complex in limestone caves', mapUrl: 'https://maps.google.com/?q=Batu+Caves' },
                        { name: 'Merdeka Square', description: 'Historic square where Malaysian independence was declared', mapUrl: 'https://maps.google.com/?q=Merdeka+Square+KL' },
                    ],
                    cafesAndFood: [
                        { name: 'Jalan Alor', cuisine: 'Street Food', priceRange: '$', address: 'Bukit Bintang' },
                        { name: 'Nasi Kandar Pelita', cuisine: 'Malaysian', priceRange: '$', address: 'Multiple locations' },
                        { name: 'Marini\'s on 57', cuisine: 'Italian/Bar', priceRange: '$$$', address: 'Petronas Towers' },
                    ],
                    transportation: {
                        airport: 'Kuala Lumpur International Airport (KUL) - 50km. KLIA Express train to KL Sentral ~30 mins.',
                        metro: 'LRT, MRT, and Monorail cover the city. Touch n Go card for all transport.',
                        taxi: 'Grab is the main ride-hailing app. Widely used and reliable.',
                        tips: 'English widely spoken. Hot and humid year-round. Rainy season Nov-March.',
                    },
                    localTips: 'Try local dishes: nasi lemak, char kway teow, roti canai. Many halal food options. Shopping malls are excellent.',
                    emergencyInfo: 'Emergency: 999 | Police: 999 | Ambulance: 999',
                },
            ],
        },
    ];

    // Insert countries and cities
    for (const countryData of countriesData) {
        console.log(`Creating country: ${countryData.name}`);

        const country = await prisma.country.upsert({
            where: { code: countryData.code },
            update: {
                name: countryData.name,
                flagEmoji: countryData.flagEmoji,
                timezone: countryData.timezone,
            },
            create: {
                name: countryData.name,
                code: countryData.code,
                flagEmoji: countryData.flagEmoji,
                timezone: countryData.timezone,
            },
        });

        for (const cityData of countryData.cities) {
            console.log(`  Creating city: ${cityData.name}`);

            await prisma.city.upsert({
                where: {
                    countryId_name: {
                        countryId: country.id,
                        name: cityData.name,
                    },
                },
                update: {
                    description: cityData.description,
                    bannerImageUrl: cityData.bannerImageUrl,
                    attractions: cityData.attractions,
                    cafesAndFood: cityData.cafesAndFood,
                    transportation: cityData.transportation,
                    localTips: cityData.localTips,
                    emergencyInfo: cityData.emergencyInfo,
                },
                create: {
                    name: cityData.name,
                    countryId: country.id,
                    description: cityData.description,
                    bannerImageUrl: cityData.bannerImageUrl,
                    attractions: cityData.attractions,
                    cafesAndFood: cityData.cafesAndFood,
                    transportation: cityData.transportation,
                    localTips: cityData.localTips,
                    emergencyInfo: cityData.emergencyInfo,
                },
            });
        }
    }

    console.log('✅ Locations seeded successfully!');
}

seedLocations()
    .catch((e) => {
        console.error('❌ Error seeding locations:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
