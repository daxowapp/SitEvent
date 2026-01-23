import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock, Users, Download, CloudSun, DollarSign, Coffee, Landmark } from "lucide-react";
import { format } from "date-fns";
import { StudentDataTable } from "./student-table";

// Mock City Data (Since we don't have this in DB yet)
const CITY_GUIDES: Record<string, any> = {
    "Istanbul": {
        currency: "TRY (Turkish Lira)",
        rate: "1 USD = 34.50 TRY",
        weather: "15°C - Mostly Sunny",
        places: [
            { name: "Hagia Sophia", type: "Attraction", desc: "Historic mosque and museum" },
            { name: "Espresso Lab", type: "Cafe", desc: "Best coffee near venue" },
            { name: "Grand Bazaar", type: "Shopping", desc: "Historic market" }
        ]
    },
    // Fallback
    "default": {
        currency: "USD",
        rate: "1 USD = 1 USD",
        weather: "20°C - Sunny",
        places: [
            { name: "City Center", type: "Attraction", desc: "Main square" },
            { name: "Starbucks", type: "Cafe", desc: "Nearby coffee" }
        ]
    }
};

export default async function UniversityEventPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            universities: {
                where: { universityId: session.user.universityId }
            }
        }
    });

    if (!event) return <div>Event not found</div>;

    const participation = event.universities[0];
    if (!participation || participation.status !== "ACCEPTED") {
        return (
            <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">
                Access Denied: You are not an accepted participant for this event.
            </div>
        );
    }

    // Fetch Registrants (All registrants for the event - simple mode for now)
    // In future, filter by those who scanned this uni's booth if needed
    const registrations = await prisma.registration.findMany({
        where: { eventId: id },
        include: {
            registrant: true
        },
        orderBy: { createdAt: 'desc' }
    });

    const cityData = (event.city && CITY_GUIDES[event.city]) || CITY_GUIDES["default"];

    return (
        <div className="space-y-6">
            <div className="border-b pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{event.title}</h1>
                        <div className="flex items-center gap-4 text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(new Date(event.startDateTime), "PPP")}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.venueName}, {event.city}</span>
                        </div>
                    </div>
                    <Badge className="bg-green-600">Booth: {participation.boothNumber || "Assigned at Venue"}</Badge>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="students">Student Data ({registrations.length})</TabsTrigger>
                    <TabsTrigger value="city">City Guide</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader><CardTitle>Event Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-medium">{format(new Date(event.startDateTime), "PPP")}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Time</span>
                                    <span className="font-medium">{format(new Date(event.startDateTime), "p")} - {format(new Date(event.endDateTime), "p")}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-gray-500">Venue</span>
                                    <span className="font-medium">{event.venueName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Address</span>
                                    <span className="font-medium text-right max-w-[200px]">{event.venueAddress}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
                            <CardContent className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{registrations.length}</div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Total Students</div>
                                </div>
                                <div className="bg-purple-50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600">12%</div>
                                    <div className="text-xs text-gray-500 uppercase font-semibold">Interest Rate</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* STUDENTS TAB */}
                <TabsContent value="students">
                    <StudentDataTable data={registrations} fileName={`students-${event.slug}`} />
                </TabsContent>

                {/* CITY GUIDES TAB */}
                <TabsContent value="city">
                    <div className="grid gap-4 md:grid-cols-3 mb-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm">Local Weather</CardTitle>
                                <CloudSun className="h-4 w-4 text-orange-500" />
                            </CardHeader>
                            <CardContent className="text-2xl font-bold">
                                {cityData.weather}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm">Currency</CardTitle>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold">{cityData.currency}</div>
                                <div className="text-xs text-muted-foreground">{cityData.rate}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <MapPin className="h-5 w-5" /> Local Attractions & Tips
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {cityData.places.map((place: any, i: number) => (
                            <Card key={i}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {place.type === 'Cafe' ? <Coffee className="h-4 w-4 text-brown-500" /> : <Landmark className="h-4 w-4 text-blue-500" />}
                                        {place.name}
                                    </CardTitle>
                                    <CardDescription>{place.type}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {place.desc}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
