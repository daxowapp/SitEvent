import { notFound } from "next/navigation";
import { CityForm } from "../../city-form";
import { getCity } from "../../actions";
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

    return <CityForm city={city} countries={countries} />;
}
