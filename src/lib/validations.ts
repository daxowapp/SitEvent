import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

// Registration form schema
export const registrationSchema = z.object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(10, "Invalid phone number"),
    country: z.string().min(2, "Country is required"),
    city: z.string().min(2, "City is required"),
    nationality: z.string().optional(),
    levelOfStudy: z.string().optional(),
    interestedMajor: z.string().optional(),
    consent: z.boolean().refine((val) => val === true, {
        message: "You must agree to the terms and privacy policy",
    }),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Event form schema (admin)
export const eventSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    slug: z
        .string()
        .min(3, "Slug must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
    country: z.string().min(2, "Country is required"),
    city: z.string().min(2, "City is required"),
    venueName: z.string().min(2, "Venue name is required"),
    venueAddress: z.string().min(5, "Venue address is required"),
    mapUrl: z.string().url().optional().or(z.literal("")),
    startDateTime: z.string().datetime(),
    endDateTime: z.string().datetime(),
    timezone: z.string().default("UTC"),
    bannerImageUrl: z.string().url().optional().or(z.literal("")),
    galleryImages: z.array(z.string().url()).default([]),
    description: z.string().optional(),
    registrationOpenAt: z.string().datetime().optional(),
    registrationCloseAt: z.string().datetime().optional(),
    capacity: z.number().int().positive().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "FINISHED"]).default("DRAFT"),
    // Tracking Scripts - Sanitized to prevent XSS
    customHeadScript: z.string().optional().transform((val) => val ? DOMPurify.sanitize(val) : val),
    customBodyScript: z.string().optional().transform((val) => val ? DOMPurify.sanitize(val) : val),
    
    // Pixel IDs
    gaTrackingId: z.string().optional(),
    fbPixelId: z.string().optional(),
    linkedInPartnerId: z.string().optional(),
    tiktokPixelId: z.string().optional(),
    snapPixelId: z.string().optional(),
    zohoLeadSource: z.string().optional(),
    zohoCampaignId: z.string().optional(),
});

export type EventFormData = z.infer<typeof eventSchema>;

// Login schema
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Check-in schema
export const checkInSchema = z.object({
    token: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
}).refine(
    (data) => data.token || data.phone || data.email,
    "Either QR token, phone, or email is required"
);

export type CheckInFormData = z.infer<typeof checkInSchema>;

// Exhibitor Inquiry Schema
export const exhibitorSchema = z.object({
    institutionName: z.string().min(2, "Institution name is required"),
    contactPerson: z.string().min(2, "Contact person name is required"),
    email: z.string().email("Invalid email address"),
    phone: z.string().min(5, "Phone number is required"),
    country: z.string().min(2, "Country is required"),
    website: z.string().url().optional().or(z.literal("")),
    notes: z.string().optional(),
    utmSource: z.string().optional(),
    utmMedium: z.string().optional(),
    utmCampaign: z.string().optional(),
});

export type ExhibitorFormData = z.infer<typeof exhibitorSchema>;
