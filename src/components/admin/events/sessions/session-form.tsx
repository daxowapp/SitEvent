"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const sessionFormSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start time",
    }),
    endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end time",
    }),
    location: z.string().optional(),
    speaker: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionFormSchema>;

interface SessionFormProps {
    defaultValues?: Partial<Omit<SessionFormValues, "startTime" | "endTime">> & {
        startTime?: Date | string;
        endTime?: Date | string;
    };
    onSubmit: (data: SessionFormValues) => void;
    onCancel: () => void;
}

export function SessionForm({ defaultValues, onSubmit, onCancel }: SessionFormProps) {
    // Format dates to datetime-local string format (YYYY-MM-DDTHH:mm)
    const formatDateForInput = (date?: Date) => {
        if (!date) return "";
        return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
    };

    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionFormSchema),
        defaultValues: {
            title: defaultValues?.title || "",
            description: defaultValues?.description || "",
            startTime: defaultValues?.startTime instanceof Date 
                ? formatDateForInput(defaultValues.startTime) 
                : defaultValues?.startTime || "",
            endTime: defaultValues?.endTime instanceof Date 
                ? formatDateForInput(defaultValues.endTime) 
                : defaultValues?.endTime || "",
            location: defaultValues?.location || "",
            speaker: defaultValues?.speaker || "",
        },
    });

    const handleSubmit = (data: SessionFormValues) => {
        // Validation: End time must be after start time
        if (new Date(data.endTime) <= new Date(data.startTime)) {
            form.setError("endTime", {
                type: "manual",
                message: "End time must be after start time",
            });
            return;
        }

        // Convert the local datetime-local string to a full Date object
        // The browser interpreting "YYYY-MM-DDTHH:mm" without "Z" creates a local date
        const startTime = new Date(data.startTime);
        const endTime = new Date(data.endTime);

        onSubmit({
            ...data,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString()
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Session title" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Start Time</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>End Time</FormLabel>
                                <FormControl>
                                    <Input type="datetime-local" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="speaker"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Speaker (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Speaker name" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Location (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Room or Hall" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Session details..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button type="submit">Save Session</Button>
                </div>
            </form>
        </Form>
    );
}
