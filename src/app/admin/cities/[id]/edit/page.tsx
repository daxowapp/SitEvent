import { notFound } from "next/navigation";
import { CityForm } from "../../city-form";
import { getCity, Attraction, CafeOrFood, Transportation } from "../../actions";
import { getCountries } from "../../../countries/actions";

interface EditCityPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCityPage({ params }: EditCityPageProps) {
    const { id } = await params;
    const [city, countries] = await Promise.all([
        getCity(id),
        getCountries()
    ]);

    if (!city) {
        notFound();
    }

    const typedCity = {
        ...city,
        attractions: city.attractions as unknown as Attraction[] | null,
        cafesAndFood: city.cafesAndFood as unknown as CafeOrFood[] | null,
        transportation: city.transportation as unknown as Transportation | null,
    };

    return <CityForm city={typedCity} countries={countries} />;
}
