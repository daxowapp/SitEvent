import "next-auth";
import { AdminRole } from "@prisma/client";

declare module "next-auth" {
    interface User {
        id: string;
        role: AdminRole | "UNIVERSITY";
        universityId?: string;
        type?: "ADMIN" | "UNIVERSITY";
    }

    interface Session {
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            universityId?: string;
            type?: "ADMIN" | "UNIVERSITY";
        };
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: string;
        universityId?: string;
        type?: "ADMIN" | "UNIVERSITY";
    }
}
