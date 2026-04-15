"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { createUniversityMember, updateUniversityMember } from "@/lib/actions/university-team";
import { toast } from "sonner";
import { UniversityRole } from "@prisma/client";

const memberSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.nativeEnum(UniversityRole),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface TeamFormProps {
    member?: {
        id: string;
        name: string | null;
        email: string;
        role: UniversityRole;
    };
    onSuccess: () => void;
}

export function TeamForm({ member, onSuccess }: TeamFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<MemberFormValues>({
        resolver: zodResolver(memberSchema),
        defaultValues: {
            name: member?.name || "",
            email: member?.email || "",
            role: member?.role || UniversityRole.MEMBER,
            password: "",
        },
    });

    async function onSubmit(values: MemberFormValues) {
        setIsLoading(true);
        try {
            if (member) {
                const result = await updateUniversityMember(member.id, values);
                if (result.success) {
                    toast.success("Team member updated successfully");
                    onSuccess();
                } else {
                    toast.error(result.error);
                }
            } else {
                if (!values.password) {
                    form.setError("password", { message: "Password is required for new accounts" });
                    setIsLoading(false);
                    return;
                }
                const result = await createUniversityMember(values as any);
                if (result.success) {
                    toast.success("Team member created successfully");
                    onSuccess();
                } else {
                    toast.error(result.error);
                }
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="john@university.edu" type="email" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Role</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value={UniversityRole.ADMIN}>Administrator</SelectItem>
                                    <SelectItem value={UniversityRole.MEMBER}>Representative (Scanner)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Administrators can manage events, leads, and this team. Representatives can only scan and view their personal scans.
                            </p>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password {member && "(Leave blank to keep current)"}</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : member ? "Update Member" : "Create Member"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
