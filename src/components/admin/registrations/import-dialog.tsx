"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "sonner"
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImportDialogProps {
    eventId?: string
    events: { id: string; title: string }[]
    onSuccess?: () => void
}

interface ImportResult {
    total: number
    success: number
    duplicates: number
    errors: number
    details: {
        email: string
        status: "success" | "duplicate" | "error"
        message?: string
        qrToken?: string
    }[]
}

export function ImportRegistrationsDialog({ eventId, events, onSuccess }: ImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "")
    const [parsedData, setParsedData] = useState<any[]>([])
    const [result, setResult] = useState<ImportResult | null>(null)

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        try {
            const data = await parseFile(file)
            setParsedData(data)
            setResult(null) // Reset previous results
        } catch (error) {
            toast.error("Failed to parse file")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const parseFile = (file: File): Promise<any[]> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = XLSX.read(data, { type: "binary" })
                    const sheetName = workbook.SheetNames[0]
                    const sheet = workbook.Sheets[sheetName]
                    const jsonData = XLSX.utils.sheet_to_json(sheet)
                    resolve(jsonData)
                } catch (err) {
                    reject(err)
                }
            }
            reader.onerror = reject
            reader.readAsBinaryString(file)
        })
    }

    const mapFields = (row: any) => {
        // Try to fuzzy match common column names
        const findKey = (keys: string[]) => Object.keys(row).find(k => keys.some(key => k.toLowerCase().includes(key)))
        
        return {
            fullName: row[findKey(["name", "full name", "student name"]) || ""] || row["Name"] || "",
            email: row[findKey(["email", "e-mail", "mail"]) || ""] || row["Email"] || "",
            phone: String(row[findKey(["phone", "mobile", "cell"]) || ""] || row["Phone"] || ""),
            country: row[findKey(["country", "nation"]) || ""] || "Unknown",
            city: row[findKey(["city", "town"]) || ""] || "Unknown",
            language: row[findKey(["lang", "language"]) || ""]?.toLowerCase() || "en",
            source: "Import"
        }
    }

    const handleImport = async () => {
        if (!selectedEventId) {
            toast.error("Please select an event")
            return
        }

        if (parsedData.length === 0) {
            toast.error("No data to import")
            return
        }

        setIsLoading(true)
        try {
            const leads = parsedData.map(mapFields).filter(l => l.email && l.fullName)
            
            if (leads.length === 0) {
                toast.error("No valid leads found (check column names)")
                return
            }

            const response = await fetch("/api/admin/registrations/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    eventId: selectedEventId,
                    leads
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Import failed")

            setResult(data)
            toast.success(`Import complete: ${data.success} imported, ${data.duplicates} duplicates`)
            if (onSuccess) onSuccess()

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Import failed")
        } finally {
            setIsLoading(false)
        }
    }

    const reset = () => {
        setParsedData([])
        setResult(null)
        // Keep event selection
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-8">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Registrations</DialogTitle>
                    <DialogDescription>
                        Upload an Excel or CSV file to import leads. Supported columns: Name, Email, Phone, Country, City.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {!parsedData.length && (
                         <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg space-y-4">
                             <div className="bg-muted p-4 rounded-full">
                                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                             </div>
                             <div className="text-center">
                                 <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                 <p className="text-xs text-muted-foreground">XLSX, CSV (max 5MB)</p>
                             </div>
                             <Input 
                                type="file" 
                                accept=".xlsx,.xls,.csv" 
                                onChange={handleFileChange}
                                className="max-w-xs"
                             />
                             {!eventId && (
                                 <div className="w-full max-w-xs space-y-2 text-left">
                                     <Label>Select Event</Label>
                                     <select 
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={selectedEventId}
                                        onChange={(e) => setSelectedEventId(e.target.value)}
                                     >
                                        <option value="">Select an event...</option>
                                        {events.map(evt => (
                                            <option key={evt.id} value={evt.id}>{evt.title}</option>
                                        ))}
                                     </select>
                                 </div>
                             )}
                         </div>
                    )}

                    {parsedData.length > 0 && !result && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Preview ({parsedData.length} records)
                                </h4>
                                <Button variant="ghost" size="sm" onClick={reset}>
                                    <RefreshCw className="mr-2 h-3 w-3" />
                                    Reset
                                </Button>
                            </div>
                            <ScrollArea className="h-[300px] rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.slice(0, 50).map((row, i) => {
                                            const mapped = mapFields(row)
                                            return (
                                                <TableRow key={i}>
                                                    <TableCell>{mapped.fullName || <span className="text-red-500">Missing</span>}</TableCell>
                                                    <TableCell>{mapped.email || <span className="text-red-500">Missing</span>}</TableCell>
                                                    <TableCell>{mapped.phone}</TableCell>
                                                </TableRow>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            {parsedData.length > 50 && (
                                <p className="text-xs text-center text-muted-foreground">Showing first 50 rows...</p>
                            )}
                        </div>
                    )}

                    {result && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-4 gap-4">
                                <div className="p-4 border rounded-lg bg-green-50">
                                    <div className="text-sm text-green-600 font-medium">Success</div>
                                    <div className="text-2xl font-bold text-green-700">{result.success}</div>
                                </div>
                                <div className="p-4 border rounded-lg bg-yellow-50">
                                    <div className="text-sm text-yellow-600 font-medium">Duplicates</div>
                                    <div className="text-2xl font-bold text-yellow-700">{result.duplicates}</div>
                                </div>
                                <div className="p-4 border rounded-lg bg-red-50">
                                    <div className="text-sm text-red-600 font-medium">Errors</div>
                                    <div className="text-2xl font-bold text-red-700">{result.errors}</div>
                                </div>
                                <div className="p-4 border rounded-lg">
                                    <div className="text-sm text-muted-foreground font-medium">Total</div>
                                    <div className="text-2xl font-bold">{result.total}</div>
                                </div>
                            </div>

                            <Tabs defaultValue="duplicates" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="duplicates">Duplicates ({result.duplicates})</TabsTrigger>
                                    <TabsTrigger value="errors">Errors ({result.errors})</TabsTrigger>
                                </TabsList>
                                <TabsContent value="duplicates">
                                    <ScrollArea className="h-[200px] rounded-md border p-2">
                                        {result.details.filter(d => d.status === "duplicate").map((d, i) => (
                                            <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                                                <span>{d.email}</span>
                                                <span className="text-muted-foreground text-xs flex items-center">
                                                    QR: {d.qrToken || "N/A"}
                                                </span>
                                            </div>
                                        ))}
                                        {result.duplicates === 0 && <p className="text-sm text-muted-foreground text-center py-4">No duplicates found.</p>}
                                    </ScrollArea>
                                </TabsContent>
                                <TabsContent value="errors">
                                     <ScrollArea className="h-[200px] rounded-md border p-2">
                                        {result.details.filter(d => d.status === "error").map((d, i) => (
                                            <div key={i} className="flex flex-col py-2 border-b last:border-0 text-sm">
                                                <span className="font-medium">{d.email}</span>
                                                <span className="text-red-500 text-xs">{d.message}</span>
                                            </div>
                                        ))}
                                        {result.errors === 0 && <p className="text-sm text-muted-foreground text-center py-4">No errors found.</p>}
                                    </ScrollArea>
                                </TabsContent>
                            </Tabs>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {result ? (
                         <Button onClick={reset}>Import More</Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)} disabled={isLoading}>Cancel</Button>
                            <Button onClick={handleImport} disabled={!parsedData.length || isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Import {parsedData.length > 0 ? `(${parsedData.length})` : ""}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
