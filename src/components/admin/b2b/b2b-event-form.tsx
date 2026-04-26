"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createB2BEvent, updateB2BEvent } from "@/app/actions/b2b";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface B2BEventFormProps {
  event?: {
    id: string;
    name: string;
    slug: string;
    date: Date | string;
    startTime: string;
    endTime: string;
    slotDuration: number;
    breakStart: string | null;
    breakEnd: string | null;
    breakBetweenMeetings: number;
    location: string | null;
    description: string | null;
  };
}

export function B2BEventForm({ event }: B2BEventFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const isEdit = !!event;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);

      // Convert date to ISO datetime
      const dateValue = formData.get("date") as string;
      if (dateValue) {
        formData.set("date", new Date(dateValue).toISOString());
      }

      const result = isEdit
        ? await updateB2BEvent(event.id, formData)
        : await createB2BEvent(formData);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(isEdit ? "Event updated!" : "Event created!");
        if (!isEdit && "eventId" in result) {
          router.push(`/admin/b2b/${result.eventId}`);
        } else {
          router.push("/admin/b2b");
        }
        router.refresh();
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const eventDate = event?.date
    ? new Date(event.date).toISOString().split("T")[0]
    : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h2 className="text-lg font-semibold">Event Details</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="name">Event Name *</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={event?.name || ""}
              placeholder="e.g., B2B Meeting - Cairo Fair 2026"
              onChange={(e) => {
                if (!isEdit) {
                  const slugInput = document.getElementById(
                    "slug"
                  ) as HTMLInputElement;
                  if (slugInput) {
                    slugInput.value = generateSlug(e.target.value);
                  }
                }
              }}
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              name="slug"
              required
              defaultValue={event?.slug || ""}
              placeholder="b2b-cairo-fair-2026"
              pattern="^[a-z0-9-]+$"
            />
            <p className="text-xs text-muted-foreground">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={eventDate}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              defaultValue={event?.location || ""}
              placeholder="e.g., Cairo International Convention Center"
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={event?.description || ""}
              placeholder="Brief description of the B2B event..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 space-y-5">
        <h2 className="text-lg font-semibold">Time Configuration</h2>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time *</Label>
            <Input
              id="startTime"
              name="startTime"
              type="time"
              required
              defaultValue={event?.startTime || "10:00"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">End Time *</Label>
            <Input
              id="endTime"
              name="endTime"
              type="time"
              required
              defaultValue={event?.endTime || "16:00"}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slotDuration">Slot Duration (minutes) *</Label>
            <Input
              id="slotDuration"
              name="slotDuration"
              type="number"
              required
              min={5}
              max={120}
              defaultValue={event?.slotDuration || 20}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Break Time (Optional)
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="breakStart">Break Start</Label>
              <Input
                id="breakStart"
                name="breakStart"
                type="time"
                defaultValue={event?.breakStart || ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="breakEnd">Break End</Label>
              <Input
                id="breakEnd"
                name="breakEnd"
                type="time"
                defaultValue={event?.breakEnd || ""}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Define a break period (e.g., lunch) where no meetings will be
            scheduled
          </p>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            Buffer Between Meetings
          </h3>
          <div className="max-w-xs space-y-2">
            <Label htmlFor="breakBetweenMeetings">Break Between Meetings (minutes)</Label>
            <Input
              id="breakBetweenMeetings"
              name="breakBetweenMeetings"
              type="number"
              min={0}
              max={30}
              defaultValue={event?.breakBetweenMeetings ?? 5}
            />
            <p className="text-xs text-muted-foreground">
              Buffer time after each meeting before the next one starts (default: 5 min)
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/admin/b2b">
          <Button type="button" variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
