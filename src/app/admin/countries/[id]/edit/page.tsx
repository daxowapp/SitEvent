import { notFound } from "next/navigation";
import { CountryForm } from "../../country-form";
import { getCountry } from "../../actions";

interface EditCountryPageProps {
    params: Promise<{ id: string }>;
}

export default async function EditCountryPage({ params }: EditCountryPageProps) {
    const { id } = await params;
    const country = await getCountry(id);

    if (!country) {
        notFound();
    }

    return <CountryForm country={country} />;
}
