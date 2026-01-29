import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, GraduationCap, Calendar, Users, Globe, Edit, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getUniversities } from "./actions";
import { Badge } from "@/components/ui/badge";
import { requireManagerOrAbove } from "@/lib/role-check";

export default async function UniversitiesPage() {
    await requireManagerOrAbove();
    const universities = await getUniversities();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Universities</h1>
                    <p className="text-muted-foreground">
                        Manage university partners and event assignments
                    </p>
                </div>
                <Button asChild>
                    <Link href="/admin/universities/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add University
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {universities.length === 0 ? (
                    <Card className="col-span-full">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No universities yet</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Add university partners to assign them to events.
                            </p>
                            <Button asChild>
                                <Link href="/admin/universities/new">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add University
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    universities.map((university) => (
                        <Card key={university.id} className="relative group hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        {university.logoUrl ? (
                                            <img
                                                src={university.logoUrl}
                                                alt={university.name}
                                                className="w-12 h-12 rounded-lg object-contain bg-muted"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <GraduationCap className="h-6 w-6 text-primary" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-lg truncate">{university.name}</CardTitle>
                                            <CardDescription className="flex items-center gap-1 mt-1">
                                                <Globe className="h-3 w-3" />
                                                {university.city ? `${university.city}, ` : ""}{university.country}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/admin/universities/${university.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4" />
                                            <span>{university._count.events} events</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{university._count.users} users</span>
                                        </div>
                                    </div>
                                    <Badge variant={university.isActive ? "default" : "secondary"}>
                                        {university.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                {university.website && (
                                    <a
                                        href={university.website}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-sm text-primary hover:underline mt-3"
                                    >
                                        <ExternalLink className="h-3 w-3" />
                                        Website
                                    </a>
                                )}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
