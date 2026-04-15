import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { TeamActions } from "./team-actions-client";

export default async function UniversityTeamPage() {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    // RBAC: Only ADMINs can acccess this page
    if (session.user.role !== "ADMIN") {
        redirect("/university/dashboard");
    }

    const members = await prisma.universityUser.findMany({
        where: {
            universityId: session.user.universityId
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight text-gray-900">Team Management</h1>
                    <p className="text-muted-foreground mt-2">Manage access and scanner representatives for your university</p>
                </div>
                <TeamActions currentUserId={session.user.id} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Staff Members ({members.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {members.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No team members found.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id} className={member.id === session.user.id ? "bg-slate-50" : ""}>
                                            <TableCell className="font-medium">
                                                {member.name || "—"}
                                                {member.id === session.user.id && (
                                                    <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>{member.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        member.role === "ADMIN"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                >
                                                    {member.role === "ADMIN" ? "Administrator" : "Representative"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(member.createdAt), "PP p")}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TeamActions member={member} currentUserId={session.user.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="mt-8 border-dashed bg-slate-50 shadow-none">
                <CardHeader>
                    <CardTitle className="text-sm">Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm mt-2">
                        <div className="flex items-start gap-4">
                            <Badge className="w-24 text-center justify-center shrink-0">ADMIN</Badge>
                            <p className="text-muted-foreground leading-relaxed">
                                Full management access. Can create new team members, globally view all leads scanned by the university, formally approve or request event participation, and access file uploads.
                            </p>
                        </div>
                        <div className="flex items-start gap-4">
                            <Badge variant="secondary" className="w-24 text-center justify-center shrink-0">MEMBER</Badge>
                            <p className="text-muted-foreground leading-relaxed">
                                Scanner representative access. Can securely open the scanner to process students. Their dashboard lead view is isolated completely so they only see the leads that they personally scanned.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
