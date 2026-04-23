"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    Plus,
    Search,
    QrCode,
    Copy,
    ExternalLink,
    Ban,
    CheckCircle,
    FileCheck,
    Download,
    Trash2,
    RefreshCw,
} from "lucide-react";

interface ValidatedDocument {
    id: string;
    token: string;
    referenceNumber: string | null;
    subject: string;
    recipientName: string | null;
    senderName: string | null;
    senderTitle: string | null;
    issuedAt: string;
    expiresAt: string | null;
    notes: string | null;
    isRevoked: boolean;
    createdAt: string;
    createdBy: { name: string; email: string };
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<ValidatedDocument[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [qrDialogOpen, setQrDialogOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<ValidatedDocument | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState("");
    const [verifyUrl, setVerifyUrl] = useState("");
    const [revokeDoc, setRevokeDoc] = useState<ValidatedDocument | null>(null);
    const [deleteDoc, setDeleteDoc] = useState<ValidatedDocument | null>(null);

    // Create form state
    const [formSubject, setFormSubject] = useState("");
    const [formRecipient, setFormRecipient] = useState("");
    const [formSenderName, setFormSenderName] = useState("");
    const [formSenderTitle, setFormSenderTitle] = useState("");
    const [formIssuedAt, setFormIssuedAt] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [formExpiresAt, setFormExpiresAt] = useState("");
    const [formNotes, setFormNotes] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/admin/documents?search=${encodeURIComponent(search)}`
            );
            const data = await res.json();
            setDocuments(data.documents || []);
            setTotal(data.total || 0);
        } catch {
            toast.error("Failed to load documents");
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleCreate = async () => {
        if (!formSubject.trim()) {
            toast.error("Subject is required");
            return;
        }

        setCreating(true);
        try {
            const res = await fetch("/api/admin/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    subject: formSubject,
                    recipientName: formRecipient,
                    senderName: formSenderName,
                    senderTitle: formSenderTitle,
                    issuedAt: formIssuedAt,
                    expiresAt: formExpiresAt || null,
                    notes: formNotes,
                }),
            });

            if (!res.ok) throw new Error("Failed to create");

            const data = await res.json();
            toast.success(`Document created: ${data.document.referenceNumber}`);

            // Show QR dialog
            setSelectedDoc(data.document);
            setQrDataUrl(data.qrDataUrl);
            setVerifyUrl(data.verifyUrl);
            setCreateOpen(false);
            setQrDialogOpen(true);

            // Reset form
            setFormSubject("");
            setFormRecipient("");
            setFormSenderName("");
            setFormSenderTitle("");
            setFormIssuedAt(new Date().toISOString().split("T")[0]);
            setFormExpiresAt("");
            setFormNotes("");

            fetchDocuments();
        } catch {
            toast.error("Failed to create document");
        } finally {
            setCreating(false);
        }
    };

    const handleViewQr = async (doc: ValidatedDocument) => {
        try {
            const res = await fetch(`/api/admin/documents/${doc.id}`);
            const data = await res.json();
            setSelectedDoc(doc);
            setQrDataUrl(data.qrDataUrl);
            setVerifyUrl(data.verifyUrl);
            setQrDialogOpen(true);
        } catch {
            toast.error("Failed to load QR code");
        }
    };

    const handleRevoke = async () => {
        if (!revokeDoc) return;
        try {
            const res = await fetch(`/api/admin/documents/${revokeDoc.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isRevoked: !revokeDoc.isRevoked }),
            });
            if (!res.ok) throw new Error();
            toast.success(
                revokeDoc.isRevoked ? "Document restored" : "Document revoked"
            );
            fetchDocuments();
        } catch {
            toast.error("Failed to update document");
        } finally {
            setRevokeDoc(null);
        }
    };

    const handleDelete = async () => {
        if (!deleteDoc) return;
        try {
            const res = await fetch(`/api/admin/documents/${deleteDoc.id}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error();
            toast.success("Document deleted");
            fetchDocuments();
        } catch {
            toast.error("Failed to delete document");
        } finally {
            setDeleteDoc(null);
        }
    };

    const copyVerifyLink = (token: string) => {
        const url = `${window.location.origin}/verify?token=${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Verification link copied!");
    };

    const downloadQr = () => {
        if (!qrDataUrl || !selectedDoc) return;
        const link = document.createElement("a");
        link.download = `QR-${selectedDoc.referenceNumber || selectedDoc.token}.png`;
        link.href = qrDataUrl;
        link.click();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileCheck className="h-6 w-6 text-purple-600" />
                        Document Validation
                    </h1>
                    <p className="text-muted-foreground">
                        Generate QR codes for letters and documents to enable
                        verification
                    </p>
                </div>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button id="create-document-btn">
                            <Plus className="h-4 w-4 mr-2" />
                            Create Document
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Validated Document</DialogTitle>
                            <DialogDescription>
                                Register a new letter or document. A unique QR
                                code and reference number will be generated
                                automatically.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="doc-subject">
                                    Subject *
                                </Label>
                                <Input
                                    id="doc-subject"
                                    placeholder="e.g. Acceptance Letter for MSc Program"
                                    value={formSubject}
                                    onChange={(e) =>
                                        setFormSubject(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="doc-recipient">
                                        Recipient Name
                                    </Label>
                                    <Input
                                        id="doc-recipient"
                                        placeholder="e.g. Ahmed Hassan"
                                        value={formRecipient}
                                        onChange={(e) =>
                                            setFormRecipient(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="doc-issued">
                                        Issued Date
                                    </Label>
                                    <Input
                                        id="doc-issued"
                                        type="date"
                                        value={formIssuedAt}
                                        onChange={(e) =>
                                            setFormIssuedAt(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="doc-sender">
                                        Sender Name
                                    </Label>
                                    <Input
                                        id="doc-sender"
                                        placeholder="e.g. Dr. Ali Yilmaz"
                                        value={formSenderName}
                                        onChange={(e) =>
                                            setFormSenderName(e.target.value)
                                        }
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="doc-title">
                                        Sender Title
                                    </Label>
                                    <Input
                                        id="doc-title"
                                        placeholder="e.g. Director of Admissions"
                                        value={formSenderTitle}
                                        onChange={(e) =>
                                            setFormSenderTitle(e.target.value)
                                        }
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="doc-expires">
                                    Expires At{" "}
                                    <span className="text-muted-foreground text-xs">
                                        (optional)
                                    </span>
                                </Label>
                                <Input
                                    id="doc-expires"
                                    type="date"
                                    value={formExpiresAt}
                                    onChange={(e) =>
                                        setFormExpiresAt(e.target.value)
                                    }
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="doc-notes">
                                    Notes{" "}
                                    <span className="text-muted-foreground text-xs">
                                        (internal only, not shown publicly)
                                    </span>
                                </Label>
                                <Textarea
                                    id="doc-notes"
                                    placeholder="Any internal notes about this document..."
                                    value={formNotes}
                                    onChange={(e) =>
                                        setFormNotes(e.target.value)
                                    }
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setCreateOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCreate}
                                disabled={creating || !formSubject.trim()}
                            >
                                {creating
                                    ? "Creating..."
                                    : "Create & Generate QR"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="search-documents"
                                placeholder="Search by subject, reference number, or recipient..."
                                className="pl-10"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={fetchDocuments}
                        >
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Documents Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>
                            Documents{" "}
                            <Badge variant="secondary" className="ml-2">
                                {total}
                            </Badge>
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading documents...
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                            <p className="font-medium">No documents found</p>
                            <p className="text-sm">
                                Create your first validated document to get
                                started.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Reference #</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>Recipient</TableHead>
                                    <TableHead>Issued</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map((doc) => (
                                    <TableRow key={doc.id}>
                                        <TableCell className="font-mono text-sm font-medium">
                                            {doc.referenceNumber || "—"}
                                        </TableCell>
                                        <TableCell className="max-w-[250px] truncate font-medium">
                                            {doc.subject}
                                        </TableCell>
                                        <TableCell>
                                            {doc.recipientName || "—"}
                                        </TableCell>
                                        <TableCell>
                                            {format(
                                                new Date(doc.issuedAt),
                                                "PP"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {doc.isRevoked ? (
                                                <Badge variant="destructive">
                                                    <Ban className="h-3 w-3 mr-1" />
                                                    Revoked
                                                </Badge>
                                            ) : doc.expiresAt &&
                                              new Date(doc.expiresAt) <
                                                  new Date() ? (
                                                <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                    Expired
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Valid
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleViewQr(doc)
                                                    }
                                                    title="View QR Code"
                                                >
                                                    <QrCode className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        copyVerifyLink(
                                                            doc.token
                                                        )
                                                    }
                                                    title="Copy Verification Link"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        window.open(
                                                            `/verify?token=${doc.token}`,
                                                            "_blank"
                                                        )
                                                    }
                                                    title="Open Verification Page"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setRevokeDoc(doc)
                                                    }
                                                    title={
                                                        doc.isRevoked
                                                            ? "Restore"
                                                            : "Revoke"
                                                    }
                                                    className={
                                                        doc.isRevoked
                                                            ? "text-emerald-600"
                                                            : "text-amber-600"
                                                    }
                                                >
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        setDeleteDoc(doc)
                                                    }
                                                    className="text-red-600"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* QR Code Dialog */}
            <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <QrCode className="h-5 w-5 text-purple-600" />
                            Document QR Code
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDoc?.referenceNumber} —{" "}
                            {selectedDoc?.subject}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4 py-4">
                        {qrDataUrl && (
                            <div className="rounded-xl border-2 border-dashed border-gray-200 p-4 bg-white">
                                <img
                                    src={qrDataUrl}
                                    alt="Document QR Code"
                                    className="w-64 h-64"
                                />
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground text-center max-w-sm">
                            Print this QR code and attach it to your letter.
                            Recipients can scan it to verify the document&apos;s
                            authenticity.
                        </p>
                        {verifyUrl && (
                            <div className="w-full">
                                <Label className="text-xs text-muted-foreground">
                                    Verification URL
                                </Label>
                                <div className="flex items-center gap-2 mt-1">
                                    <Input
                                        readOnly
                                        value={verifyUrl}
                                        className="text-xs font-mono"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                verifyUrl
                                            );
                                            toast.success("URL copied!");
                                        }}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="flex gap-2">
                        <Button variant="outline" onClick={downloadQr}>
                            <Download className="h-4 w-4 mr-2" />
                            Download QR
                        </Button>
                        <Button
                            onClick={() => setQrDialogOpen(false)}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Revoke Confirmation */}
            <AlertDialog
                open={!!revokeDoc}
                onOpenChange={() => setRevokeDoc(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {revokeDoc?.isRevoked
                                ? "Restore Document?"
                                : "Revoke Document?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {revokeDoc?.isRevoked
                                ? `This will restore "${revokeDoc?.subject}" and make it valid again for verification.`
                                : `This will revoke "${revokeDoc?.subject}". Anyone scanning the QR code will see that this document is no longer valid.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRevoke}>
                            {revokeDoc?.isRevoked ? "Restore" : "Revoke"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Confirmation */}
            <AlertDialog
                open={!!deleteDoc}
                onOpenChange={() => setDeleteDoc(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{deleteDoc?.subject}&quot;
                            ({deleteDoc?.referenceNumber}). This action cannot be
                            undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
