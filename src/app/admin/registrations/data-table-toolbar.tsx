"use client"

import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"

interface DataTableToolbarProps {
    searchQuery: string
    setSearchQuery: (value: string) => void
    eventId: string | null
    setEventId: (value: string | null) => void
    status: string | null
    setStatus: (value: string | null) => void
    source: string | null
    setSource: (value: string | null) => void
    events: { id: string; title: string }[]
    sources: string[]
}

export function DataTableToolbar({
    searchQuery,
    setSearchQuery,
    eventId,
    setEventId,
    status,
    setStatus,
    source,
    setSource,
    events,
    sources
}: DataTableToolbarProps) {
    const isFiltered = !!searchQuery || !!eventId || !!status || !!source

    const handleReset = () => {
        setSearchQuery("")
        setEventId(null)
        setStatus(null)
        setSource(null)
    }

    return (
        <div className="flex flex-wrap items-center justify-between">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <Input
                    placeholder="Filter registrations..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                {events && events.length > 0 && (
                    <DataTableFacetedFilter
                        title="Event"
                        options={events.map(evt => ({ label: evt.title, value: evt.id }))}
                        value={eventId || undefined}
                        onSelect={(val) => setEventId(val)}
                    />
                )}
                {sources && sources.length > 0 && (
                    <DataTableFacetedFilter
                        title="Source"
                        options={sources.map(src => ({ label: src, value: src }))}
                        value={source || undefined}
                        onSelect={(val) => setSource(val)}
                    />
                )}
                <DataTableFacetedFilter
                    title="Status"
                    options={[
                        { label: "Registered", value: "REGISTERED" },
                        { label: "Attended", value: "Attended" },
                        { label: "Cancelled", value: "CANCELLED" },
                    ]}
                    value={status || undefined}
                    onSelect={(val) => setStatus(val)}
                />

                {isFiltered && (
                    <Button
                        variant="ghost"
                        onClick={handleReset}
                        className="h-8 px-2 lg:px-3"
                    >
                        Reset
                        <X className="ml-2 h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
