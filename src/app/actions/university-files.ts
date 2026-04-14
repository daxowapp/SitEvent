"use server";

/**
 * University File Management Server Actions
 * Handles file upload metadata, listing, and deletion
 */

import { prisma } from "@/lib/db";

interface CreateFileParams {
  universityId: string;
  fileName: string;
  fileUrl: string;
  fileType: "PDF" | "IMAGE" | "VIDEO" | "DOCUMENT";
  fileSize: number;
  label: string;
  description?: string;
}

/**
 * Create a file record after upload to Supabase Storage
 */
export async function createUniversityFile(params: CreateFileParams) {
  try {
    const file = await prisma.universityFile.create({
      data: {
        universityId: params.universityId,
        fileName: params.fileName,
        fileUrl: params.fileUrl,
        fileType: params.fileType,
        fileSize: params.fileSize,
        label: params.label,
        description: params.description || null,
      },
    });

    return { success: true, file };
  } catch (error) {
    console.error("Failed to create university file:", error);
    return { success: false, error: "Failed to save file record." };
  }
}

/**
 * Get all files for a university
 */
export async function getUniversityFiles(universityId: string) {
  const files = await prisma.universityFile.findMany({
    where: { universityId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return files;
}

/**
 * Delete (soft-delete) a university file
 */
export async function deleteUniversityFile(fileId: string, universityId: string) {
  try {
    await prisma.universityFile.update({
      where: { id: fileId, universityId },
      data: { isActive: false },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete university file:", error);
    return { success: false, error: "Failed to delete file." };
  }
}

/**
 * Update a university file's label or description
 */
export async function updateUniversityFile(
  fileId: string,
  universityId: string,
  data: { label?: string; description?: string }
) {
  try {
    const file = await prisma.universityFile.update({
      where: { id: fileId, universityId },
      data,
    });

    return { success: true, file };
  } catch (error) {
    console.error("Failed to update university file:", error);
    return { success: false, error: "Failed to update file." };
  }
}

/**
 * Get files for a university that should be sent to a student
 * (all active files for that university)
 */
export async function getFilesForStudent(universityId: string) {
  const files = await prisma.universityFile.findMany({
    where: {
      universityId,
      isActive: true,
    },
    select: {
      id: true,
      label: true,
      fileName: true,
      fileUrl: true,
      fileType: true,
      fileSize: true,
      description: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return files;
}
