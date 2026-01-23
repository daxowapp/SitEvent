import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Globe, MapPin, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { getCountries } from "./actions";
import { DeleteCountryButton } from "./delete-button";

export default async function CountriesPage() {
    const countries = await getCountries();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Countries</h1>
                    <p className="text-muted-foreground">
                        Manage countries for event locations
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/countries/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Country
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {countries.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No countries yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Add your first country to start organizing events by location.
                            </p>
                            <Button asChild>
                                <Link href="/admin/countries/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Country
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    countries.map((country) => (
                        <Card key={country.id} className="relative group">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-3xl">{country.flagEmoji || "🏳️"}</span>
                                        <div>
                                            <CardTitle className="text-lg">{country.name}</CardTitle>
                                            <p className="text-sm text-muted-foreground font-mono">
                                                {country.code}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/admin/countries/${country.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <DeleteCountryButton
                                            countryId={country.id}
                                            countryName={country.name}
                                            cityCount={country._count.cities}
                                        />
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{country._count.cities} cities</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Globe className="h-4 w-4" />
                                        <span>{country.timezone}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
