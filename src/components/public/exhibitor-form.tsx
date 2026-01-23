"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { exhibitorSchema, type ExhibitorFormData } from "@/lib/validations";
import { submitExhibitorInquiry } from "@/app/actions/exhibitor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExhibitorFormProps {
    eventId?: string;
    eventName?: string;
    className?: string; // Allow custom styling
}

export function ExhibitorForm({ eventId, eventName, className }: ExhibitorFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<ExhibitorFormData>({
        resolver: zodResolver(exhibitorSchema),
    });

    const onSubmit = async (data: ExhibitorFormData) => {
        setIsSubmitting(true);
        try {
            // If no eventId is provided, we use a generic placeholder or "general-inquiry"
            const targetEventId = eventId || "general";

            const result = await submitExhibitorInquiry(targetEventId, data);

            if (result.error) {
                toast.error(result.error);
                return;
            }

            toast.success("Inquiry sent successfully! We will contact you shortly.");
            reset();
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-gray-100", className)}>
            <div className="space-y-2 mb-6">
                <h3 className="text-2xl font-serif font-bold text-gray-900">
                    {eventName ? `Book Stand: ${eventName}` : "Partner With Us"}
                </h3>
                <p className="text-gray-500 text-sm">
                    Fill out the form below to receive our media kit and pricing information.
                </p>
            </div>

            <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="institutionName">Institution Name *</Label>
                        <Input id="institutionName" placeholder="University of Example" {...register("institutionName")} />
                        {errors.institutionName && <p className="text-red-500 text-xs">{errors.institutionName.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input id="website" placeholder="https://..." {...register("website")} />
                        {errors.website && <p className="text-red-500 text-xs">{errors.website.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person *</Label>
                    <Input id="contactPerson" placeholder="Full Name" {...register("contactPerson")} />
                    {errors.contactPerson && <p className="text-red-500 text-xs">{errors.contactPerson.message}</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input id="email" type="email" placeholder="contact@university.edu" {...register("email")} />
                        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number *</Label>
                        <Input id="phone" placeholder="+1 234..." {...register("phone")} />
                        {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" placeholder="Institution Country" {...register("country")} />
                    {errors.country && <p className="text-red-500 text-xs">{errors.country.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Additional Questions (Optional)</Label>
                    <Textarea
                        id="notes"
                        placeholder="Tell us about your recruitment goals..."
                        {...register("notes")}
                        rows={3}
                    />
                </div>
            </div>

            <Button
                type="submit"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 text-lg"
                disabled={isSubmitting}
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending...
                    </>
                ) : (
                    "Submit Inquiry"
                )}
            </Button>

            <p className="text-xs text-center text-gray-400 mt-4">
                By submitting this form, you agree to our terms and conditions.
            </p>
        </form>
    );
}
