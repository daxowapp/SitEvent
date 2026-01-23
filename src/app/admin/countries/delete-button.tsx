"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteCountry } from "./actions";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeleteCountryButtonProps {
    countryId: string;
    countryName: string;
    cityCount: number;
}

export function DeleteCountryButton({ countryId, countryName, cityCount }: DeleteCountryButtonProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deleteCountry(countryId);
        } catch (error) {
            console.error("Failed to delete country:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {countryName}?</AlertDialogTitle>
                    <AlertDialogDescription>
                        {cityCount > 0 ? (
                            <>
                                This will also delete <strong>{cityCount} cities</strong> and their data.
                                This action cannot be undone.
                            </>
                        ) : (
                            "This action cannot be undone."
                        )}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
