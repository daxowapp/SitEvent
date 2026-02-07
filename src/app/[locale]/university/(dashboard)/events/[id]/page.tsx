import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, CloudSun, DollarSign, Coffee, Landmark } from "lucide-react";
import { format } from "date-fns";
import { StudentDataTable } from "./student-table";
import { RegisterEventButton } from "@/components/university/register-event-button";
import { EventProgramTimeline } from "@/components/university/event-program-timeline";

interface Attraction {
    name: string;
    description: string;
    imageUrl?: string;
    mapUrl?: string;
    type?: string; 
}

interface Cafe {
    name: string;
    cuisine: string;
    priceRange: string;
    address: string;
    mapUrl?: string;
    type?: string; 
}

interface Transportation {
    airport?: string;
    metro?: string;
    taxi?: string;
    tips?: string;
}

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
            },
            cityRef: {
                include: {
                    country: true
                }
            },
            sessions: {
                orderBy: {
                    startTime: 'asc'
                }
            }
        }
    });

    if (!event) return <div>Event not found</div>;

    const participation = event.universities[0];
    const status = participation?.status;
    const isAccepted = status === "ACCEPTED" || status === "INVITED";
    const isPending = status === "REQUESTED";
    const isParticipating = isAccepted; 

    // Fetch Registrants (only if accepted)
    const registrations = isAccepted ? await prisma.registration.findMany({
        where: { eventId: id },
        include: {
            registrant: true
        },
        orderBy: { createdAt: 'desc' }
    }) : [];

    // Process City Data
    const attractions = (event.cityRef?.attractions as unknown as Attraction[]) || [];
    const cafes = (event.cityRef?.cafesAndFood as unknown as Cafe[]) || [];
    const transportation = (event.cityRef?.transportation as unknown as Transportation) || {};

    // Helper to get location string
    const locationString = event.cityRef 
        ? `${event.cityRef.name}, ${event.cityRef.country.name}`
        : `${event.city}, ${event.country}`;

    return (
        <div className="space-y-6">
            <div className="border-b pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{event.title}</h1>
                        <div className="flex items-center gap-4 text-gray-500 mt-2">
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(new Date(event.startDateTime), "PPP")}</span>
                            <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.venueName}, {locationString}</span>
                        </div>
                    </div>
                    {isAccepted && (
                        <div className="flex gap-2">
                            <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200">Booth: {participation.boothNumber || "Assigned at Venue"}</Badge>
                            <Button asChild variant="outline" className="gap-2">
                                <a href={`/en/kiosk/${event.slug}`} target="_blank" rel="noopener noreferrer">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-presentation"><path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="M7 21h10"/></svg>
                                    Open Kiosk
                                </a>
                            </Button>
                        </div>
                    )}
                    {isPending && (
                        <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200">Pending Approval</Badge>
                    )}
                    {!participation && (
                        <RegisterEventButton eventId={event.id} className="bg-red-600 hover:bg-red-700 text-white" />
                    )}
                </div>
            </div>

            <Tabs defaultValue={isAccepted ? "overview" : "city"} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    {isAccepted && <TabsTrigger value="program">Program</TabsTrigger>}
                    {isAccepted && <TabsTrigger value="students">Student Data ({registrations.length})</TabsTrigger>}
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

                        {isAccepted && (
                            <Card>
                                <CardHeader><CardTitle>Quick Stats</CardTitle></CardHeader>
                                <CardContent className="grid grid-cols-2 gap-4">
                                    <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-red-600">{registrations.length}</div>
                                        <div className="text-xs text-red-800/60 uppercase font-semibold">Total Students</div>
                                    </div>
                                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg text-center">
                                        <div className="text-2xl font-bold text-gray-700">--%</div>
                                        <div className="text-xs text-gray-500 uppercase font-semibold">Interest Rate</div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                        
                        {isPending && (
                            <Card className="bg-yellow-50 border-yellow-100">
                                <CardHeader><CardTitle className="text-yellow-800">Request Pending</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-yellow-700 mb-4">You have requested access to this event. An administrator will review your request shortly. You will be notified via email once approved.</p>
                                    <Button disabled className="w-full bg-yellow-600/50 text-white cursor-not-allowed">Request Sent</Button>
                                </CardContent>
                            </Card>
                        )}

                        {!participation && (
                            <Card className="bg-orange-50 border-orange-100">
                                <CardHeader><CardTitle className="text-orange-800">Registration Required</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-orange-700 mb-4">You have not yet registered for this event. Join us to access student data and manage your booth.</p>
                                    <RegisterEventButton eventId={event.id} className="w-full bg-orange-600 hover:bg-orange-700 text-white" text="Register Now" />
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Description</CardTitle></CardHeader>
                        <CardContent>
                            <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* PROGRAM TAB */}
                {isAccepted && (
                    <TabsContent value="program">
                       <Card>
                           <CardHeader>
                               <CardTitle>Event Program</CardTitle>
                               <CardDescription>
                                   Schedule in {event.timezone} ({locationString} Time)
                               </CardDescription>
                           </CardHeader>
                           <CardContent>
                               <EventProgramTimeline 
                                   sessions={event.sessions} 
                                   timezone={event.timezone || "UTC"} 
                               />
                           </CardContent>
                       </Card>
                    </TabsContent>
                )}

                {/* STUDENTS TAB */}
                {isAccepted && (
                    <TabsContent value="students">
                        <StudentDataTable data={registrations} fileName={`students-${event.slug}`} />
                    </TabsContent>
                )}

                {/* CITY GUIDES TAB */}
                <TabsContent value="city">
                    {!event.cityRef ? (
                         <div className="p-12 text-center bg-gray-50 rounded-lg text-gray-500">
                            No city guide information available for this event yet.
                         </div>
                    ) : (
                        <>
                            <div className="grid gap-4 md:grid-cols-3 mb-6">
                                {transportation.airport && (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                                            <CardTitle className="text-sm">Airport Info</CardTitle>
                                            <CloudSun className="h-4 w-4 text-blue-500" />
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-600 line-clamp-3">{transportation.airport}</p>
                                        </CardContent>
                                    </Card>
                                )}
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm">Currency</CardTitle>
                                        <DollarSign className="h-4 w-4 text-green-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-xl font-bold">{event.currency}</div>
                                        {/* Rate would need an API or manual field, skipping for now */}
                                    </CardContent>
                                </Card>
                            </div>

                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <MapPin className="h-5 w-5" /> Attractions
                            </h3>
                            {attractions.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
                                    {attractions.map((place: Attraction, i: number) => (
                                        <Card key={i}>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Landmark className="h-4 w-4 text-blue-500" />
                                                    {place.name}
                                                </CardTitle>
                                                <CardDescription>{place.type || 'Attraction'}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                                                {place.mapUrl && (
                                                    <a href={place.mapUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> View on Map
                                                    </a>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : <p className="text-gray-500 mb-8">No attractions listed.</p>}

                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Coffee className="h-5 w-5" /> Youtube & Food
                            </h3>
                            {cafes.length > 0 ? (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {cafes.map((place: Cafe, i: number) => (
                                        <Card key={i}>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2 text-base">
                                                    <Coffee className="h-4 w-4 text-brown-500" />
                                                    {place.name}
                                                </CardTitle>
                                                <CardDescription>{place.cuisine} • {place.priceRange}</CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-gray-600 mb-2">{place.address}</p>
                                                {place.mapUrl && (
                                                    <a href={place.mapUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> View on Map
                                                    </a>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : <p className="text-gray-500">No cafes listed.</p>}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
