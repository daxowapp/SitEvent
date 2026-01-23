import { CityForm } from "../city-form";
import { getCountries } from "../../countries/actions";

export default async function NewCityPage() {
    const countries = await getCountries();

    return <CityForm countries={countries} />;
}
