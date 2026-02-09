"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Calendar, 
    MapPin, 
    Clock, 
    Building2, 
    Users, 
    TrendingUp, 
    ExternalLink,
    Sparkles,
    Target,
    Plane,
    DollarSign,
    Coffee,
    Landmark,
    Navigation,
    Search,
    Star
} from "lucide-react";
import { format } from "date-fns";
import { tr, enUS } from "date-fns/locale";
import { AnimatedNumber, StaggerContainer, StaggerItem, AnimatedCard } from "@/components/ui/motion";
import Link from "next/link";
import { StudentSearchModal } from "./student-search-modal";
import { FavoritesList } from "./favorites-list";
import { useTranslations, useLocale } from "next-intl";


// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring" as const,
            stiffness: 300,
            damping: 24
        }
    }
};

const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: [0.25, 0.4, 0.25, 1] as [number, number, number, number]
        }
    }
};

interface EventSession {
    id: string;
    title: string;
    description?: string | null;
    startTime: Date;
    endTime: Date;
}

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

interface EventDetailClientProps {
    event: {
        id: string;
        title: string;
        slug: string;
        description: string;
        startDateTime: Date;
        endDateTime: Date;
        venueName: string;
        venueAddress: string;
        city: string;
        country: string;
        currency: string;
        timezone: string;
        sessions: EventSession[];
    };
    locationString: string;
    isAccepted: boolean;
    isPending: boolean;
    participation?: {
        boothNumber?: string | null;
    };
    registrationsCount: number;
    attractions: Attraction[];
    cafes: Cafe[];
    transportation: Transportation;
    hasCityRef: boolean;
    children?: React.ReactNode;
    studentTableComponent?: React.ReactNode;
    registerButtonComponent?: React.ReactNode;
    programComponent?: React.ReactNode;
}

export function EventDetailClient({
    event,
    locationString,
    isAccepted,
    isPending,
    participation,
    registrationsCount,
    attractions,
    cafes,
    transportation,
    hasCityRef,
    studentTableComponent,
    registerButtonComponent,
    programComponent,
}: EventDetailClientProps) {
    const t = useTranslations('university.eventDetail');
    const locale = useLocale();
    const dateLocale = locale === 'tr' ? tr : enUS;
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [favoritesRefreshTrigger, setFavoritesRefreshTrigger] = useState(0);

    const handleFavoriteAdded = () => {
        setFavoritesRefreshTrigger(prev => prev + 1);
    };

    return (
        <>
        <StudentSearchModal
            eventId={event.id}
            isOpen={searchModalOpen}
            onClose={() => setSearchModalOpen(false)}
            onFavoriteAdded={handleFavoriteAdded}
        />
        <motion.div
            className="space-y-8"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* Hero Header */}
            <motion.div 
                className="relative rounded-3xl overflow-hidden"
                variants={heroVariants}
            >
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-purple-500/10" />
                <motion.div 
                    className="absolute inset-0 opacity-30"
                    animate={{
                        background: [
                            "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 80% 80%, rgba(239,68,68,0.15) 0%, transparent 50%)",
                            "radial-gradient(circle at 20% 20%, rgba(239,68,68,0.15) 0%, transparent 50%)"
                        ]
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                />

                <div className="relative px-8 py-10">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="space-y-4 flex-1">
                            {/* Status Badge */}
                            <motion.div
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {isAccepted && (
                                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 px-4 py-1.5 text-sm font-semibold shadow-lg shadow-emerald-200">
                                        <motion.span 
                                            className="w-2 h-2 rounded-full bg-white mr-2 inline-block"
                                            animate={{ 
                                                boxShadow: ["0 0 0 0 rgba(255,255,255,0.4)", "0 0 0 8px rgba(255,255,255,0)", "0 0 0 0 rgba(255,255,255,0)"]
                                            }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                        />
                                        {t('activeParticipant')}
                                    </Badge>
                                )}
                                {isPending && (
                                    <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0 px-4 py-1.5 text-sm font-semibold shadow-lg shadow-amber-200">
                                        <motion.span 
                                            className="w-2 h-2 rounded-full bg-amber-900 mr-2 inline-block animate-pulse"
                                        />
                                        {t('pendingApproval')}
                                    </Badge>
                                )}
                                {!participation && (
                                    <Badge className="bg-gray-100 text-gray-700 border-0 px-4 py-1.5 text-sm font-semibold">
                                        {t('notRegistered')}
                                    </Badge>
                                )}
                            </motion.div>

                            {/* Event Title */}
                            <h1 className="text-4xl md:text-5xl font-display font-bold text-gray-900 tracking-tight">
                                {event.title}
                            </h1>

                            {/* Event Meta */}
                            <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                <motion.div 
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <Calendar className="h-5 w-5 text-red-500" />
                                    <span className="font-medium">{format(new Date(event.startDateTime), "PPP", { locale: dateLocale })}</span>
                                </motion.div>
                                <motion.div 
                                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <MapPin className="h-5 w-5 text-red-500" />
                                    <span className="font-medium">{locationString}</span>
                                </motion.div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3">
                            {isAccepted && participation && (
                                <>
                                    <motion.div
                                        className="col-span-2 lg:col-span-1 px-5 py-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-100 shadow-lg text-center"
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.4 }}
                                    >
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{t('yourBooth')}</div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {participation.boothNumber || t('tba')}
                                        </div>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button asChild className="bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200 hover:from-red-600 hover:to-red-700 h-12 px-6 rounded-xl">
                                            <Link href={`/en/kiosk/${event.slug}`} target="_blank">
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                {t('openKiosk')}
                                            </Link>
                                        </Button>
                                    </motion.div>
                                    <motion.div
                                        whileHover={{ scale: 1.03 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <Button 
                                            onClick={() => setSearchModalOpen(true)}
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-200 hover:from-amber-600 hover:to-orange-600 h-12 px-6 rounded-xl"
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            {t('findStudent')}
                                        </Button>
                                    </motion.div>
                                </>
                            )}
                            {!participation && registerButtonComponent}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Tabs Section */}
            <motion.div variants={itemVariants}>
                <Tabs defaultValue={isAccepted ? "overview" : "city"} className="w-full">
                    <TabsList className="mb-6 bg-gray-100/80 p-1.5 rounded-2xl w-full flex justify-start overflow-x-auto no-scrollbar touch-pan-x snap-x">
                        <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-3 font-medium">
                            {t('tabs.overview')}
                        </TabsTrigger>
                        {isAccepted && (
                            <TabsTrigger value="program" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-3 font-medium">
                                {t('tabs.program')}
                            </TabsTrigger>
                        )}
                        {isAccepted && (
                            <TabsTrigger value="students" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-3 font-medium">
                                {t('tabs.studentData')}
                                <Badge className="ml-2 bg-red-100 text-red-700 border-0">
                                    {registrationsCount}
                                </Badge>
                            </TabsTrigger>
                        )}
                        {isAccepted && (
                            <TabsTrigger value="favorites" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-3 font-medium">
                                <Star className="h-4 w-4 mr-1.5 fill-amber-400 text-amber-400" />
                                {t('tabs.favorites')}
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="city" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-md px-6 py-3 font-medium">
                            {t('tabs.cityGuide')}
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6">
                        <StaggerContainer className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                            {/* Event Info Card */}
                            <StaggerItem className="lg:col-span-2">
                                <AnimatedCard hoverScale={1.01} hoverY={-4}>
                                    <Card className="h-full rounded-2xl border-gray-100 shadow-lg overflow-hidden">
                                        <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 rounded-xl bg-red-100">
                                                    <Sparkles className="h-5 w-5 text-red-600" />
                                                </div>
                                                <CardTitle>{t('eventDetails')}</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <div className="p-3 rounded-xl bg-white shadow-sm">
                                                            <Calendar className="h-5 w-5 text-red-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t('date')}</div>
                                                            <div className="font-semibold text-gray-900">{format(new Date(event.startDateTime), "PPPP", { locale: dateLocale })}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <div className="p-3 rounded-xl bg-white shadow-sm">
                                                            <Clock className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t('time')}</div>
                                                            <div className="font-semibold text-gray-900">
                                                                {format(new Date(event.startDateTime), "p", { locale: dateLocale })} - {format(new Date(event.endDateTime), "p", { locale: dateLocale })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <div className="p-3 rounded-xl bg-white shadow-sm">
                                                            <Building2 className="h-5 w-5 text-purple-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t('venue')}</div>
                                                            <div className="font-semibold text-gray-900">{event.venueName}</div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                                        <div className="p-3 rounded-xl bg-white shadow-sm">
                                                            <Navigation className="h-5 w-5 text-emerald-500" />
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 uppercase tracking-wider">{t('address')}</div>
                                                            <div className="font-semibold text-gray-900 text-sm">{event.venueAddress}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </AnimatedCard>
                            </StaggerItem>

                            {/* Stats Card - Only for accepted */}
                            {isAccepted && (
                                <StaggerItem>
                                    <AnimatedCard hoverScale={1.02} hoverY={-6}>
                                        <Card className="h-full bg-gradient-to-br from-red-500 via-red-600 to-orange-500 border-0 shadow-xl shadow-red-200 text-white rounded-2xl overflow-hidden">
                                            <motion.div 
                                                className="absolute inset-0"
                                                animate={{ 
                                                    background: [
                                                        "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                                                        "radial-gradient(circle at 100% 100%, rgba(255,255,255,0.1) 0%, transparent 50%)",
                                                        "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.1) 0%, transparent 50%)"
                                                    ]
                                                }}
                                                transition={{ duration: 4, repeat: Infinity }}
                                            />
                                            <CardHeader className="relative z-10">
                                                <CardTitle className="text-white/90 flex items-center gap-2">
                                                    <Target className="h-5 w-5" />
                                                    {t('performance')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative z-10 space-y-6">
                                                <div className="text-center">
                                                    <div className="text-6xl font-display font-bold">
                                                        <AnimatedNumber value={registrationsCount} duration={1.5} />
                                                    </div>
                                                    <div className="text-white/80 mt-2">{t('studentsCollected')}</div>
                                                </div>
                                                <div className="flex items-center justify-center gap-2 text-white/70">
                                                    <TrendingUp className="h-4 w-4" />
                                                    <span className="text-sm">{t('growingDaily')}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </AnimatedCard>
                                </StaggerItem>
                            )}

                            {/* Pending Card */}
                            {isPending && (
                                <StaggerItem>
                                    <AnimatedCard hoverScale={1.02} hoverY={-4}>
                                        <Card className="h-full bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 rounded-2xl">
                                            <CardHeader>
                                                <CardTitle className="text-amber-800 flex items-center gap-2">
                                                    <motion.div
                                                        animate={{ rotate: [0, 10, -10, 0] }}
                                                        transition={{ duration: 2, repeat: Infinity }}
                                                    >
                                                        <Clock className="h-5 w-5" />
                                                    </motion.div>
                                                    {t('requestPending')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-amber-700 mb-4">
                                                    {t('pendingMessage')}
                                                </p>
                                                <Button disabled className="w-full bg-amber-200 text-amber-800 cursor-not-allowed">
                                                    {t('awaitingResponse')}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </AnimatedCard>
                                </StaggerItem>
                            )}

                            {/* Registration Card */}
                            {!participation && (
                                <StaggerItem>
                                    <AnimatedCard hoverScale={1.02} hoverY={-4}>
                                        <Card className="h-full bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 rounded-2xl">
                                            <CardHeader>
                                                <CardTitle className="text-orange-800 flex items-center gap-2">
                                                    <Users className="h-5 w-5" />
                                                    {t('joinEvent')}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-orange-700 mb-4">
                                                    {t('joinMessage')}
                                                </p>
                                                {registerButtonComponent}
                                            </CardContent>
                                        </Card>
                                    </AnimatedCard>
                                </StaggerItem>
                            )}
                        </StaggerContainer>

                        {/* Description */}
                        <motion.div variants={itemVariants}>
                            <Card className="rounded-2xl border-gray-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                                    <CardTitle>{t('aboutEvent')}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{event.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </TabsContent>

                    {/* PROGRAM TAB */}
                    {isAccepted && (
                        <TabsContent value="program">
                            <Card className="rounded-2xl border-gray-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-xl bg-purple-100">
                                            <Calendar className="h-5 w-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <CardTitle>{t('eventProgram')}</CardTitle>
                                            <CardDescription>
                                                {t('scheduleInfo', { timezone: event.timezone, location: locationString })}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    {programComponent}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* STUDENTS TAB */}
                    {isAccepted && (
                        <TabsContent value="students">
                            {studentTableComponent}
                        </TabsContent>
                    )}

                    {/* FAVORITES TAB */}
                    {isAccepted && (
                        <TabsContent value="favorites">
                            <Card className="rounded-2xl border-gray-100 shadow-lg">
                                <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-xl bg-amber-100">
                                                <Star className="h-5 w-5 text-amber-600 fill-amber-400" />
                                            </div>
                                            <div>
                                                <CardTitle>{t('favoriteStudents')}</CardTitle>
                                                <CardDescription>
                                                    {t('favoriteStudentsDesc')}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button 
                                            onClick={() => setSearchModalOpen(true)}
                                            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                                        >
                                            <Search className="h-4 w-4 mr-2" />
                                            {t('findStudent')}
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <FavoritesList 
                                        eventId={event.id}
                                        refreshTrigger={favoritesRefreshTrigger}
                                        onFindStudent={() => setSearchModalOpen(true)}
                                    />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}

                    {/* CITY GUIDE TAB */}
                    <TabsContent value="city">
                        {!hasCityRef ? (
                            <motion.div 
                                className="p-16 text-center bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-dashed border-gray-200"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <MapPin className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-xl font-bold text-gray-400 mb-2">{t('noCityGuide')}</h3>
                                <p className="text-gray-400">{t('cityGuidePending')}</p>
                            </motion.div>
                        ) : (
                            <StaggerContainer className="space-y-8">
                                {/* Quick Info Cards */}
                                <div className="grid gap-4 md:grid-cols-3">
                                    {transportation.airport && (
                                        <StaggerItem>
                                            <AnimatedCard hoverScale={1.02} hoverY={-4}>
                                                <Card className="rounded-2xl border-gray-100 shadow-lg h-full">
                                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                        <CardTitle className="text-sm font-medium">{t('airportInfo')}</CardTitle>
                                                        <div className="p-2 rounded-xl bg-blue-100">
                                                            <Plane className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        <p className="text-sm text-gray-600">{transportation.airport}</p>
                                                    </CardContent>
                                                </Card>
                                            </AnimatedCard>
                                        </StaggerItem>
                                    )}
                                    <StaggerItem>
                                        <AnimatedCard hoverScale={1.02} hoverY={-4}>
                                            <Card className="rounded-2xl border-gray-100 shadow-lg h-full">
                                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                                    <CardTitle className="text-sm font-medium">{t('currency')}</CardTitle>
                                                    <div className="p-2 rounded-xl bg-emerald-100">
                                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="text-3xl font-bold text-gray-900">{event.currency}</div>
                                                </CardContent>
                                            </Card>
                                        </AnimatedCard>
                                    </StaggerItem>
                                </div>

                                {/* Attractions */}
                                {attractions.length > 0 && (
                                    <motion.div variants={itemVariants}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-xl bg-purple-100">
                                                <Landmark className="h-5 w-5 text-purple-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{t('attractions')}</h3>
                                        </div>
                                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                            {attractions.map((place, i) => (
                                                <AnimatedCard key={i} hoverScale={1.02} hoverY={-4}>
                                                    <Card className="rounded-2xl border-gray-100 shadow-lg h-full">
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-base">
                                                                <Landmark className="h-4 w-4 text-purple-500" />
                                                                {place.name}
                                                            </CardTitle>
                                                            <CardDescription>{place.type || 'Attraction'}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-gray-600 mb-3">{place.description}</p>
                                                            {place.mapUrl && (
                                                                <a 
                                                                    href={place.mapUrl} 
                                                                    target="_blank" 
                                                                    rel="noreferrer" 
                                                                    className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                                                                >
                                                                    <MapPin className="h-3.5 w-3.5" /> {t('viewOnMap')}
                                                                </a>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </AnimatedCard>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Cafes */}
                                {cafes.length > 0 && (
                                    <motion.div variants={itemVariants}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2 rounded-xl bg-amber-100">
                                                <Coffee className="h-5 w-5 text-amber-600" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900">{t('cafesRestaurants')}</h3>
                                        </div>
                                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                            {cafes.map((place, i) => (
                                                <AnimatedCard key={i} hoverScale={1.02} hoverY={-4}>
                                                    <Card className="rounded-2xl border-gray-100 shadow-lg h-full">
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-base">
                                                                <Coffee className="h-4 w-4 text-amber-500" />
                                                                {place.name}
                                                            </CardTitle>
                                                            <CardDescription>{place.cuisine} • {place.priceRange}</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-gray-600 mb-3">{place.address}</p>
                                                            {place.mapUrl && (
                                                                <a 
                                                                    href={place.mapUrl} 
                                                                    target="_blank" 
                                                                    rel="noreferrer" 
                                                                    className="inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium"
                                                                >
                                                                    <MapPin className="h-3.5 w-3.5" /> {t('viewOnMap')}
                                                                </a>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </AnimatedCard>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </StaggerContainer>
                        )}
                    </TabsContent>
                    </Tabs>
            </motion.div>
        </motion.div>
        </>
    );
}
