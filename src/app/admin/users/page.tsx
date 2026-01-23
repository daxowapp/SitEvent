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
import { UserActions } from "./user-actions-client";
import { requireRole } from "@/lib/role-check";
import { AdminRole } from "@prisma/client";

// Mock data
const MOCK_USERS = [
    {
        id: "mock-admin",
        name: "Mock Admin",
        email: "admin@example.com",
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
        lastLoginAt: new Date(),
        createdAt: new Date(),
    },
    {
        id: "mock-staff",
        name: "Event Staff",
        email: "staff@example.com",
        role: AdminRole.EVENT_STAFF,
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
    },
];

function isDatabaseConfigured(): boolean {
    return !!(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('[project-ref]'));
}

async function getUsers() {
    if (!isDatabaseConfigured()) {
        return MOCK_USERS;
    }

    try {
        const { prisma } = await import("@/lib/db");
        return await prisma.adminUser.findMany({
            orderBy: { createdAt: "desc" },
        });
    } catch (error) {
        console.error("Users database error, using mock data:", error);
        return MOCK_USERS;
    }
}

export default async function UsersPage() {
    await requireRole([AdminRole.SUPER_ADMIN]);
    const users = await getUsers();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Users</h1>
                    <p className="text-muted-foreground">Manage admin users and roles</p>
                </div>
                <UserActions />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Admin Users ({users.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {users.length === 0 ? (
                        <p className="text-center py-8 text-muted-foreground">
                            No users found.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(users as any[]).map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.role === "SUPER_ADMIN"
                                                            ? "default"
                                                            : user.role === "EVENT_MANAGER"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                >
                                                    {user.role.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.isActive ? "default" : "destructive"}>
                                                    {user.isActive ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.lastLoginAt
                                                    ? format(new Date(user.lastLoginAt), "PP p")
                                                    : "Never"}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <UserActions user={user} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Role Permissions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3">
                            <Badge>SUPER ADMIN</Badge>
                            <p className="text-muted-foreground">
                                Full system access - can manage events, registrations, users, and all settings.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Badge variant="secondary">EVENT MANAGER</Badge>
                            <p className="text-muted-foreground">
                                Can create and manage events, view registrations, export data, and access scanner.
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Badge variant="outline">EVENT STAFF</Badge>
                            <p className="text-muted-foreground">
                                Scanner access only - can check in attendees at events.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
