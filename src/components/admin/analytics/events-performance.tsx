
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EventsPerformanceProps {
    data: {
        name: string;
        date: string;
        registrations: number;
        checkIns: number;
        attendanceRate: number;
    }[];
}

export function EventsPerformance({ data }: EventsPerformanceProps) {
    return (
        <Card className="col-span-full">
            <CardHeader>
                <CardTitle>Top Events Performance</CardTitle>
                <CardDescription>
                    Highest performing events by registration volume and attendance rates.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Event Name</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Registrations</TableHead>
                            <TableHead className="text-right">Check-ins</TableHead>
                            <TableHead className="text-right">Attendance Rate</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((event, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{event.name}</TableCell>
                                <TableCell className="text-muted-foreground">{event.date}</TableCell>
                                <TableCell className="text-right">{event.registrations}</TableCell>
                                <TableCell className="text-right">{event.checkIns}</TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <span className="text-sm font-medium">{event.attendanceRate}%</span>
                                        <div className="h-2 w-16 rounded-full bg-slate-100 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    event.attendanceRate >= 70 ? 'bg-green-500' :
                                                    event.attendanceRate >= 40 ? 'bg-yellow-500' :
                                                    'bg-red-500'
                                                }`} 
                                                style={{ width: `${event.attendanceRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
