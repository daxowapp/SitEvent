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
import { Loader2, Upload, FileSpreadsheet, ArrowRight, ArrowLeft } from "lucide-react"
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
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ImportDialogProps {
    eventId?: string
    events: { id: string; title: string }[]
    onSuccess?: () => void
}

interface ImportResult {
    total: number
    success: number
    updated: number
    duplicates: number
    errors: number
    details: {
        email: string
        status: "success" | "duplicate" | "error" | "updated"
        message?: string
        qrToken?: string
    }[]
}

const SYSTEM_FIELDS = [
    { key: "fullName", label: "Full Name", required: true },
    { key: "email", label: "Email", required: true },
    { key: "phone", label: "Phone", required: false },
    { key: "country", label: "Country", required: false },
    { key: "city", label: "City", required: false },
    { key: "language", label: "Language", required: false },
]

export function ImportRegistrationsDialog({ eventId, events, onSuccess }: ImportDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedEventId, setSelectedEventId] = useState<string>(eventId || "")
    const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "result">("upload")
    
    // Data State
    const [rawFile, setRawFile] = useState<any[]>([])
    const [headers, setHeaders] = useState<string[]>([])
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
    const [mappedData, setMappedData] = useState<any[]>([])
    
    // Result State
    const [result, setResult] = useState<ImportResult | null>(null)
    const [progress, setProgress] = useState(0)
    const [batchStatus, setBatchStatus] = useState("")

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsLoading(true)
        try {
            const data = await parseFile(file)
            if (data.length === 0) throw new Error("File is empty")
            
            setRawFile(data)
            const fileHeaders = Object.keys(data[0])
            setHeaders(fileHeaders)
            
            // Initial Auto-Mapping
            const initialMapping: Record<string, string> = {}
            SYSTEM_FIELDS.forEach(field => {
                const match = fileHeaders.find(h => 
                    h.toLowerCase().includes(field.label.toLowerCase()) || 
                    h.toLowerCase().includes(field.key.toLowerCase())
                )
                if (match) initialMapping[field.key] = match
            })
            setColumnMapping(initialMapping)
            setStep("mapping")
        } catch (error) {
            toast.error("Failed to parse file")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const parseFile = async (file: File): Promise<Record<string, unknown>[]> => {
        // Use Papaparse for CSV files
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
            const Papa = (await import("papaparse")).default
            return new Promise((resolve, reject) => {
                Papa.parse(file, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        resolve(results.data as Record<string, unknown>[])
                    },
                    error: (error) => {
                        reject(error)
                    }
                })
            })
        }

        // Use XLSX for Excel files
        const importedModule = await import("xlsx")
        const read = importedModule.read || importedModule.default?.read
        const utils = importedModule.utils || importedModule.default?.utils
        
        if (!read || !utils) {
            throw new Error("Could not load XLSX library correctly")
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = (e) => {
                try {
                    const data = e.target?.result
                    const workbook = read(data, { type: "binary" })
                    const sheetName = workbook.SheetNames[0]
                    const sheet = workbook.Sheets[sheetName]
                    const jsonData = utils.sheet_to_json(sheet)
                    resolve(jsonData as Record<string, unknown>[])
                } catch (err) {
                    reject(err)
                }
            }
            reader.onerror = reject
            reader.readAsBinaryString(file)
        })
    }

    const processMapping = () => {
        const processed = rawFile.map(row => {
            const newRow: any = { source: "Import" }
            Object.entries(columnMapping).forEach(([systemKey, csvHeader]) => {
                if (csvHeader && row[csvHeader] !== undefined) {
                    newRow[systemKey] = row[csvHeader]
                }
            })
            
            // Clean up missing required fields logic if needed here, 
            // but we filter later.
            // Ensure strings
            if (newRow.phone) newRow.phone = String(newRow.phone)
            if (newRow.language) newRow.language = String(newRow.language).toLowerCase()
                
            return newRow
        }).filter(l => l.email && l.fullName) // Basic validation

        if (processed.length === 0) {
            toast.error("No valid leads found with current mapping")
            return
        }

        setMappedData(processed)
        setStep("preview")
    }

    const handleImport = async () => {
        if (!selectedEventId) {
            toast.error("Please select an event")
            return
        }

        if (mappedData.length === 0) {
            toast.error("No data to import")
            return
        }

        setIsLoading(true)
        setStep("importing")
        setProgress(0)
        
        try {
            // Batch processing settings
            const batchSize = 5
            const chunks = []
            for (let i = 0; i < mappedData.length; i += batchSize) {
                chunks.push(mappedData.slice(i, i + batchSize))
            }

            const accumulatedResults: ImportResult = {
                total: mappedData.length,
                success: 0,
                updated: 0,
                duplicates: 0,
                errors: 0,
                details: []
            }

            // Process chunks sequentially
            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i]
                setBatchStatus(`Processing batch ${i + 1} of ${chunks.length}...`)
                
                try {
                    const response = await fetch("/api/admin/registrations/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            eventId: selectedEventId,
                            leads: chunk
                        })
                    })

                    const data = await response.json()
                    
                    if (!response.ok) {
                        const errors = chunk.map(l => ({
                            email: l.email,
                            status: "error" as const,
                            message: data.error || "Batch failed"
                        }))
                        accumulatedResults.errors += chunk.length
                        accumulatedResults.details.push(...errors)
                    } else {
                        accumulatedResults.success += data.success
                        accumulatedResults.updated += data.updated
                        accumulatedResults.duplicates += data.duplicates
                        accumulatedResults.errors += data.errors
                        accumulatedResults.details.push(...data.details)
                    }

                    setResult({...accumulatedResults})
                    setProgress(Math.round(((i + 1) / chunks.length) * 100))

                    // Rate limit friendly delay
                    await new Promise(resolve => setTimeout(resolve, 500))

                } catch (error) {
                    console.error(`Batch ${i + 1} failed:`, error)
                    accumulatedResults.errors += chunk.length
                    accumulatedResults.details.push(...chunk.map(l => ({
                        email: l.email,
                        status: "error" as const,
                        message: "Network error"
                    })))
                    setResult({...accumulatedResults})
                }
            }

            setStep("result")
            setBatchStatus("Import complete!")
            toast.success(`Import finished: ${accumulatedResults.success} success`)
            if (onSuccess) onSuccess()

        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Import failed")
            setStep("preview") // Go back on critical failure
        } finally {
            setIsLoading(false)
        }
    }

    const reset = () => {
        setRawFile([])
        setMappedData([])
        setResult(null)
        setProgress(0)
        setBatchStatus("")
        setStep("upload")
        setColumnMapping({})
        setHeaders([])
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val) reset()
            setOpen(val)
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="h-8">
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Import Registrations</DialogTitle>
                    <DialogDescription>
                        {step === "upload" && "Upload an Excel or CSV file to get started."}
                        {step === "mapping" && "Map columns from your file to system fields."}
                        {step === "preview" && "Review data before importing."}
                        {step === "importing" && "Processing your import..."}
                        {step === "result" && "Import Verification Report"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 px-1">
                    {step === "upload" && (
                         <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg space-y-6">
                             <div className="bg-muted p-6 rounded-full">
                                <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                             </div>
                             <div className="text-center space-y-2">
                                 <p className="text-lg font-medium">Click to upload or drag and drop</p>
                                 <p className="text-sm text-muted-foreground">XLSX, CSV (max 5MB)</p>
                             </div>
                             <Input 
                                type="file" 
                                accept=".xlsx,.xls,.csv" 
                                onChange={handleFileChange}
                                className="max-w-xs cursor-pointer"
                             />
                             {!eventId && (
                                 <div className="w-full max-w-xs space-y-2 text-left pt-4 border-t">
                                     <Label>Select Event</Label>
                                     <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select an event..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {events.map(evt => (
                                                <SelectItem key={evt.id} value={evt.id}>{evt.title}</SelectItem>
                                            ))}
                                        </SelectContent>
                                     </Select>
                                 </div>
                             )}
                         </div>
                    )}

                    {step === "mapping" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium mb-4">System Fields</h4>
                                    <div className="space-y-4">
                                        {SYSTEM_FIELDS.map(field => (
                                            <div key={field.key} className="h-10 flex items-center">
                                                <span className="text-sm">
                                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-medium mb-4">CSV Column</h4>
                                    <div className="space-y-4">
                                        {SYSTEM_FIELDS.map(field => (
                                            <div key={field.key}>
                                                <Select 
                                                    value={columnMapping[field.key] || "ignore"} 
                                                    onValueChange={(val) => setColumnMapping(prev => ({ ...prev, [field.key]: val }))}
                                                >
                                                    <SelectTrigger className={!columnMapping[field.key] ? "border-red-300" : ""}>
                                                        <SelectValue placeholder="Select column..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="ignore">-- Ignore --</SelectItem>
                                                        {headers.map(h => (
                                                            <SelectItem key={h} value={h}>{h}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === "preview" && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                    Preview ({mappedData.length} valid records)
                                </h4>
                            </div>
                            <ScrollArea className="h-[400px] rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Full Name</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>City</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {mappedData.slice(0, 50).map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell>{row.fullName}</TableCell>
                                                <TableCell>{row.email}</TableCell>
                                                <TableCell>{row.phone}</TableCell>
                                                <TableCell>{row.city}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                            <p className="text-xs text-muted-foreground">
                                * Rows with missing Name or Email are automatically filtered out.
                            </p>
                        </div>
                    )}

                    {(step === "importing" || step === "result") && (
                        <div className="space-y-6 py-4">
                            {step === "importing" && (
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>{batchStatus}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} />
                                </div>
                            )}

                            {(result || step === "result") && (
                                <>
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="p-4 border rounded-lg bg-green-50">
                                            <div className="text-sm text-green-600 font-medium">Success</div>
                                            <div className="text-2xl font-bold text-green-700">{result?.success || 0}</div>
                                        </div>
                                        <div className="p-4 border rounded-lg bg-blue-50">
                                            <div className="text-sm text-blue-600 font-medium">Updated</div>
                                            <div className="text-2xl font-bold text-blue-700">{result?.updated || 0}</div>
                                        </div>
                                        <div className="p-4 border rounded-lg bg-yellow-50">
                                            <div className="text-sm text-yellow-600 font-medium">Duplicates</div>
                                            <div className="text-2xl font-bold text-yellow-700">{result?.duplicates || 0}</div>
                                        </div>
                                        <div className="p-4 border rounded-lg bg-red-50">
                                            <div className="text-sm text-red-600 font-medium">Errors</div>
                                            <div className="text-2xl font-bold text-red-700">{result?.errors || 0}</div>
                                        </div>
                                    </div>

                                    {result && (
                                        <Tabs defaultValue="updated" className="w-full">
                                            <TabsList className="grid w-full grid-cols-3">
                                                <TabsTrigger value="updated">Updated</TabsTrigger>
                                                <TabsTrigger value="duplicates">Duplicates</TabsTrigger>
                                                <TabsTrigger value="errors">Errors</TabsTrigger>
                                            </TabsList>
                                            <TabsContent value="updated">
                                                <ScrollArea className="h-[200px] rounded-md border p-2">
                                                    {result.details.filter(d => d.status === "updated").map((d, i) => (
                                                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                                                            <span>{d.email}</span>
                                                            <span className="text-muted-foreground text-xs">{d.message || "Updated"}</span>
                                                        </div>
                                                    ))}
                                                    {result.updated === 0 && <p className="text-sm text-muted-foreground text-center py-4">No updated records.</p>}
                                                </ScrollArea>
                                            </TabsContent>
                                            <TabsContent value="duplicates">
                                                <ScrollArea className="h-[200px] rounded-md border p-2">
                                                    {result.details.filter(d => d.status === "duplicate").map((d, i) => (
                                                        <div key={i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                                                            <span>{d.email}</span>
                                                            <span className="text-muted-foreground text-xs">QR: {d.qrToken || "N/A"}</span>
                                                        </div>
                                                    ))}
                                                    {result.duplicates === 0 && <p className="text-sm text-muted-foreground text-center py-4">No duplicates.</p>}
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
                                                    {result.errors === 0 && <p className="text-sm text-muted-foreground text-center py-4">No errors.</p>}
                                                </ScrollArea>
                                            </TabsContent>
                                        </Tabs>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="pt-2 border-t">
                    {step === "upload" && (
                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    )}

                    {step === "mapping" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("upload")}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Button onClick={processMapping} disabled={!columnMapping["fullName"] || !columnMapping["email"]}>
                                Continue <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {step === "preview" && (
                        <>
                            <Button variant="outline" onClick={() => setStep("mapping")}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Button onClick={handleImport} disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Start Import
                            </Button>
                        </>
                    )}

                    {step === "result" && (
                        <Button onClick={reset}>Import More</Button>
                    )}
                    
                    {step === "importing" && (
                         <Button disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
