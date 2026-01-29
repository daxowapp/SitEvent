import { CityForm } from "../city-form";
import { getCountries } from "../../countries/actions";
import { requireRole } from "@/lib/role-check";
import { AdminRole } from "@prisma/client";

export default async function NewCityPage() {
    await requireRole([AdminRole.SUPER_ADMIN]);
    const countries = await getCountries();

    return <CityForm countries={countries} />;
}
