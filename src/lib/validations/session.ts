

import { z } from "zod";

export const sessionSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    location: z.string().optional(),
    speaker: z.string().optional(),
});

export type SessionSchema = z.infer<typeof sessionSchema>;
