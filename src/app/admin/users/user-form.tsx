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
import { createAdminUser, updateAdminUser } from "@/lib/actions/user-actions";
import { toast } from "sonner";
import { AdminRole } from "@prisma/client";

const userSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    role: z.nativeEnum(AdminRole),
    password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormProps {
    user?: {
        id: string;
        name: string;
        email: string;
        role: AdminRole;
    };
    onSuccess: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<UserFormValues>({
        resolver: zodResolver(userSchema),
        defaultValues: {
            name: user?.name || "",
            email: user?.email || "",
            role: user?.role || AdminRole.EVENT_STAFF,
            password: "",
        },
    });

    async function onSubmit(values: UserFormValues) {
        setIsLoading(true);
        try {
            if (user) {
                const result = await updateAdminUser(user.id, values);
                if (result.success) {
                    toast.success("User updated successfully");
                    onSuccess();
                } else {
                    toast.error(result.error);
                }
            } else {
                if (!values.password) {
                    form.setError("password", { message: "Password is required for new users" });
                    setIsLoading(false);
                    return;
                }
                const result = await createAdminUser(values as any);
                if (result.success) {
                    toast.success("User created successfully");
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
                                <Input placeholder="john@example.com" type="email" {...field} />
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
                                    <SelectItem value={AdminRole.SUPER_ADMIN}>Super Admin</SelectItem>
                                    <SelectItem value={AdminRole.EVENT_MANAGER}>Event Manager</SelectItem>
                                    <SelectItem value={AdminRole.EVENT_STAFF}>Event Staff</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Password {user && "(Leave blank to keep current)"}</FormLabel>
                            <FormControl>
                                <Input type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : user ? "Update User" : "Create User"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
