import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { GlobalLeadsTable } from "./leads-table";
import { Users } from "lucide-react";

export default async function UniversityLeadsPage() {
    const session = await auth();

    if (!session || session.user.type !== "UNIVERSITY" || !session.user.universityId) {
        redirect("/university/login");
    }

    const universityId = session.user.universityId;

    // Fetch All Registrants for Assigned Events
    // Strict Access Control: Only fetch registrations where the event has this university assigned
    const leads = await prisma.registration.findMany({
        where: {
            event: {
                universities: {
                    some: {
                        universityId: universityId
                    }
                }
            }
        },
        include: {
            registrant: true,
            event: {
                select: {
                    title: true,
                    startDateTime: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-end border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold font-display text-gray-900 tracking-tight">Global Lead Database</h1>
                    <p className="text-gray-500 mt-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Consolidated list of students from all your assigned events.
                    </p>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
                    <span className="block text-xs text-red-600 uppercase font-bold tracking-wider">Total Leads</span>
                    <span className="block text-2xl font-bold text-red-700">{leads.length}</span>
                </div>
            </div>

            <GlobalLeadsTable data={leads} />
        </div>
    );
}
