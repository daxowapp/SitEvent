"use client"

import { X, Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTableFacetedFilter } from "@/components/ui/data-table-faceted-filter"
import { ImportRegistrationsDialog } from "@/components/admin/registrations/import-dialog"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableToolbarProps {
    searchQuery: string
    setSearchQuery: (value: string) => void
    eventId: string | null
    setEventId: (value: string | null) => void
    status: string | null
    setStatus: (value: string | null) => void
    source: string | null
    setSource: (value: string | null) => void
    checkedIn: string | null
    setCheckedIn: (value: string | null) => void
    events: { id: string; title: string }[]
    sources: string[]
    sort: string
    setSort: (value: string) => void
    visibleColumns: Record<string, boolean>
    setVisibleColumns: (value: Record<string, boolean>) => void
    columns: { id: string; label: string }[]
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
    checkedIn,
    setCheckedIn,
    events,
    sources,
    sort,
    setSort,
    visibleColumns,
    setVisibleColumns,
    columns
}: DataTableToolbarProps) {
    const isFiltered = !!searchQuery || !!eventId || !!status || !!source || !!checkedIn

    const handleReset = () => {
        setSearchQuery("")
        setEventId(null)
        setStatus(null)
        setSource(null)
        setCheckedIn(null)
        setSort("desc")
    }

    return (
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                <Input
                    placeholder="Filter registrations..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-8 w-[150px] lg:w-[250px]"
                />
                
                <DataTableFacetedFilter
                    title="Sort Date"
                    options={[
                        { label: "Newest First", value: "desc" },
                        { label: "Oldest First", value: "asc" },
                    ]}
                    value={sort}
                    onSelect={(val) => setSort(val || "desc")}
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
                <DataTableFacetedFilter
                    title="Check-in Status"
                    options={[
                        { label: "Checked In", value: "true" },
                        { label: "Not Checked In", value: "false" },
                    ]}
                    value={checkedIn || undefined}
                    onSelect={(val) => setCheckedIn(val)}
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
            <div className="flex items-center gap-2">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-auto hidden h-8 lg:flex"
                        >
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {columns.map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.id}
                                    className="capitalize"
                                    checked={visibleColumns[column.id]}
                                    onCheckedChange={(value) => {
                                            setVisibleColumns({
                                                ...visibleColumns,
                                                [column.id]: !!value
                                            })
                                    }}
                                >
                                    {column.label}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ImportRegistrationsDialog 
                    eventId={eventId || undefined}
                    events={events}
                    onSuccess={() => window.location.reload()} 
                />
            </div>
        </div>
    )
}
