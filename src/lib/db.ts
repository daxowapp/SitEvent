import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    // Force connection limit to avoid "MaxClients" error in deployment if not set
    const url = process.env.DATABASE_URL;
    let modifiedUrl = url;

    if (url && !url.includes("connection_limit")) {
        const separator = url.includes("?") ? "&" : "?";
        modifiedUrl = `${url}${separator}connection_limit=5`;
    }

    return new PrismaClient({
        datasources: {
            db: {
                url: modifiedUrl,
            },
        },
        log:
            process.env.NODE_ENV === "development"
                ? ["query", "error", "warn"]
                : ["error"],
    });
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
