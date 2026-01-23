import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, Calendar, Building2, Globe } from "lucide-react";
import Link from "next/link";
import { getCities } from "./actions";
import { getCountries } from "../countries/actions";

interface PageProps {
    searchParams: Promise<{ countryId?: string }>;
}

export default async function CitiesPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const [cities, countries] = await Promise.all([
        getCities(params.countryId),
        getCountries()
    ]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Cities</h1>
                    <p className="text-muted-foreground">
                        Manage city data for events (attractions, transportation, local tips)
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/cities/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add City
                    </Link>
                </Button>
            </div>

            {/* Country Filter */}
            <div className="flex gap-2 flex-wrap">
                <Link
                    href="/admin/cities"
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${!params.countryId
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background hover:bg-muted border-input"
                        }`}
                >
                    All Countries
                </Link>
                {countries.map((country) => (
                    <Link
                        key={country.id}
                        href={`/admin/cities?countryId=${country.id}`}
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors flex items-center gap-1.5 ${params.countryId === country.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted border-input"
                            }`}
                    >
                        <span>{country.flagEmoji}</span>
                        <span>{country.name}</span>
                    </Link>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cities.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No cities yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                {params.countryId
                                    ? "No cities in this country. Add your first city."
                                    : "Add cities with local information for your events."}
                            </p>
                            <Button asChild>
                                <Link href="/admin/cities/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add City
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    cities.map((city) => {
                        const attractions = (city.attractions as any[]) || [];
                        const cafes = (city.cafesAndFood as any[]) || [];
                        const hasContent = attractions.length > 0 || cafes.length > 0 || city.description;

                        return (
                            <Link key={city.id} href={`/admin/cities/${city.id}/edit`}>
                                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                                    {city.bannerImageUrl && (
                                        <div className="h-32 overflow-hidden rounded-t-lg">
                                            <img
                                                src={city.bannerImageUrl}
                                                alt={city.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    )}
                                    <CardHeader className={city.bannerImageUrl ? "pt-4" : ""}>
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <CardTitle className="text-lg flex items-center gap-2">
                                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                                    {city.name}
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-1 mt-1">
                                                    <span>{city.country.flagEmoji}</span>
                                                    <span>{city.country.name}</span>
                                                </CardDescription>
                                            </div>
                                            {!hasContent && (
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                                                    Needs content
                                                </span>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-4 w-4" />
                                                <span>{city._count.events} events</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Building2 className="h-4 w-4" />
                                                <span>{attractions.length} attractions</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })
                )}
            </div>
        </div>
    );
}
