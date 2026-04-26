"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Handshake, Loader2, ExternalLink, Users, Calendar,
  CheckCircle2, Settings,
} from "lucide-react";
import Link from "next/link";
import {
  enableB2BForEvent,
  disableB2BForEvent,
  getB2BForEvent,
} from "@/app/actions/b2b";

interface B2BSectionProps {
  eventId: string;
}

type B2BData = Awaited<ReturnType<typeof getB2BForEvent>>;

export function B2BSection({ eventId }: B2BSectionProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [b2bData, setB2bData] = useState<B2BData>(null);
  const [showConfig, setShowConfig] = useState(false);

  // B2B config fields
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("16:00");
  const [slotDuration, setSlotDuration] = useState(20);
  const [breakStart, setBreakStart] = useState("");
  const [breakEnd, setBreakEnd] = useState("");

  useEffect(() => {
    loadB2BData();
  }, [eventId]);

  const loadB2BData = async () => {
    setLoading(true);
    const data = await getB2BForEvent(eventId);
    setB2bData(data);
    setLoading(false);
  };

  const handleEnable = async () => {
    setActionLoading("enable");
    const result = await enableB2BForEvent(eventId, {
      startTime,
      endTime,
      slotDuration,
      breakStart: breakStart || undefined,
      breakEnd: breakEnd || undefined,
    });

    if (result.error) {
      toast.error(result.error);
      if (result.b2bEventId) {
        // Already enabled, reload data
        loadB2BData();
      }
    } else {
      toast.success("B2B Matchmaking enabled!");
      loadB2BData();
      setShowConfig(false);
    }
    setActionLoading("");
  };

  const handleDisable = async () => {
    if (!confirm("Are you sure? This will remove the B2B event and all its participants.")) return;
    setActionLoading("disable");
    const result = await disableB2BForEvent(eventId);
    if (result.error) toast.error(result.error);
    else { toast.success("B2B disabled"); setB2bData(null); }
    setActionLoading("");
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium flex items-center gap-2">
              <Handshake className="h-4 w-4" /> B2B Matchmaking
            </h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const isEnabled = !!b2bData;
  const sideACount = b2bData?.participants?.filter((p) => p.side === "A").length || 0;
  const sideBCount = b2bData?.participants?.filter((p) => p.side === "B").length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium flex items-center gap-2">
            <Handshake className="h-4 w-4" /> B2B Matchmaking
          </h3>
          <p className="text-sm text-muted-foreground">
            Enable automated B2B meeting scheduling for this event
          </p>
        </div>
        {isEnabled ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisable}
            disabled={actionLoading === "disable"}
            className="text-destructive hover:text-destructive"
          >
            {actionLoading === "disable" ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : null}
            Disable B2B
          </Button>
        ) : (
          <Switch
            checked={showConfig}
            onCheckedChange={setShowConfig}
          />
        )}
      </div>

      {/* Config form when enabling */}
      {!isEnabled && showConfig && (
        <div className="space-y-4 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-top-2 duration-200">
          <p className="text-sm text-muted-foreground">
            Configure the B2B meeting time slots for this event:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>B2B Start Time *</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>B2B End Time *</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Slot Duration (min)</Label>
              <Input
                type="number"
                min={5}
                max={120}
                value={slotDuration}
                onChange={(e) => setSlotDuration(parseInt(e.target.value) || 20)}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Break Start (optional)</Label>
              <Input
                type="time"
                value={breakStart}
                onChange={(e) => setBreakStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Break End (optional)</Label>
              <Input
                type="time"
                value={breakEnd}
                onChange={(e) => setBreakEnd(e.target.value)}
              />
            </div>
          </div>

          <Button
            onClick={handleEnable}
            disabled={actionLoading === "enable"}
            className="gap-2"
          >
            {actionLoading === "enable" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Handshake className="h-4 w-4" />
            )}
            Enable B2B Matchmaking
          </Button>
        </div>
      )}

      {/* Status when enabled */}
      {isEnabled && (
        <div className="pl-4 border-l-2 border-emerald-300 space-y-3">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-medium">B2B Matchmaking is active</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
              <p className="text-xl font-bold text-blue-600">{sideACount}</p>
              <p className="text-[11px] text-muted-foreground">Universities</p>
            </div>
            <div className="rounded-lg border bg-purple-50 dark:bg-purple-950/20 p-3 text-center">
              <p className="text-xl font-bold text-purple-600">{sideBCount}</p>
              <p className="text-[11px] text-muted-foreground">Participants</p>
            </div>
            <div className="rounded-lg border bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
              <p className="text-xl font-bold text-emerald-600">{b2bData._count.meetings}</p>
              <p className="text-[11px] text-muted-foreground">Meetings</p>
            </div>
          </div>

          <Link href={`/admin/b2b/${b2bData.id}`}>
            <Button variant="outline" size="sm" className="gap-2 w-full">
              <Settings className="h-4 w-4" />
              Manage B2B — Participants & Schedule
              <ExternalLink className="h-3.5 w-3.5 ml-auto" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
