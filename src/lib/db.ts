import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const prismaClientSingleton = () => {
    // Force aggressive connection limits for serverless/pooled environments
    const url = process.env.DATABASE_URL;
    let modifiedUrl = url;

    if (url) {
        const separator = url.includes("?") ? "&" : "?";
        // We forcibly append these parameters. If they exist earlier, Prisma usually respects the last one or we just rely on this.
        // For safety, checking exclusion is better.
        const params = [];
        if (!url.includes("connection_limit")) params.push("connection_limit=1");
        if (!url.includes("pgbouncer")) params.push("pgbouncer=true");

        if (params.length > 0) {
            modifiedUrl = `${url}${separator}${params.join("&")}`;
        }
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
