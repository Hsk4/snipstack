"use server";

import type { Snippet, SupportedLanguages, UpdateSnippetInput } from "@/app/types";
import { supabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { mergeTags, validateSnippet, type FieldErrors } from "@/lib/snippet";

/* ---------- types ---------- */

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: FieldErrors };

export type CreateSnippetPayload = {
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  isPublic: boolean;
  /** @deprecated Ignored. The owner is always the signed-in Clerk user. */
  userId?: string;
};

type SnippetRow = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string[] | string | null;
  isPublic: boolean | null;
  createdAt: string;
  updatedAt: string;
};

/* ---------- helpers (not exported: "use server" files only export async functions) ---------- */

function parseTags(raw: SnippetRow["tags"]): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapRow(row: SnippetRow): Snippet {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description ?? undefined,
    code: row.code,
    language: row.language as SupportedLanguages,
    tags: parseTags(row.tags),
    isPublic: Boolean(row.isPublic),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

function revalidateAll(): void {
  revalidatePath("/dashboard");
  revalidatePath("/");
}

const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "Unknown error";

/* ---------- READ ---------- */

// Public snippets for the discovery feed
export async function getPublicSnippets(): Promise<Snippet[]> {
  try {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("isPublic", true)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (error: unknown) {
    console.error("Failed to fetch public snippets:", error);
    return [];
  }
}

// Snippets owned by the signed-in user
export async function getUserSnippets(): Promise<Snippet[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return (data ?? []).map(mapRow);
  } catch (error: unknown) {
    console.error("Failed to fetch user snippets:", error);
    return [];
  }
}

// One snippet by id. Private snippets are only visible to their owner.
export async function getSnippetById(id: string): Promise<Snippet | null> {
  const { userId } = await auth();

  try {
    const { data, error } = await supabase
      .from("snippets")
      .select("*")
      .eq("id", id)
      .maybeSingle(); // null (not an error) when the id doesn't exist

    if (error) throw error;
    if (!data) return null;

    const snippet = mapRow(data);
    if (!snippet.isPublic && snippet.userId !== userId) return null;
    return snippet;
  } catch (error: unknown) {
    console.error("Failed to fetch snippet:", JSON.stringify(error, null, 2));
    return null;
  }
}

/* ---------- CREATE ---------- */

// userId comes from Clerk on the server, never from the client
export async function createSnippet(
  input: CreateSnippetPayload,
): Promise<ActionResult<Snippet>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to save snippets." };

  const clean = {
    title: input.title.trim(),
    description: (input.description ?? "").trim(),
    code: input.code,
    language: input.language,
    tags: mergeTags([], input.tags.join(",")),
  };

  const fieldErrors = validateSnippet(clean);
  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      error: "Fix the highlighted fields and try again.",
      fieldErrors,
    };
  }

  try {
    const { data, error } = await supabase
      .from("snippets")
      .insert([
        {
          userId,
          title: clean.title,
          description: clean.description || undefined,
          code: clean.code,
          language: clean.language,
          tags: clean.tags,
          isPublic: Boolean(input.isPublic),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    revalidateAll();
    return { success: true, data: mapRow(data) };
  } catch (error: unknown) {
    console.error("Failed to create snippet:", error);
    return { success: false, error: errorMessage(error) };
  }
}

/* ---------- UPDATE ---------- */

// Only the owner can update, and only the fields you send are changed
export async function updateSnippet(
  input: UpdateSnippetInput,
): Promise<ActionResult<Snippet>> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to edit snippets." };

  const { id, ...patch } = input;
  const fields = {
    title: patch.title?.trim(),
    description: patch.description?.trim(),
    code: patch.code,
    language: patch.language,
    tags: patch.tags ? mergeTags([], patch.tags.join(",")) : undefined,
  };

  const fieldErrors = validateSnippet(fields, true);
  if (Object.keys(fieldErrors).length) {
    return {
      success: false,
      error: "Fix the highlighted fields and try again.",
      fieldErrors,
    };
  }

  const update: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (fields.title !== undefined) update.title = fields.title;
  if (fields.description !== undefined) update.description = fields.description || null;
  if (fields.code !== undefined) update.code = fields.code;
  if (fields.language !== undefined) update.language = fields.language;
  if (fields.tags !== undefined) update.tags = fields.tags;
  if (patch.isPublic !== undefined) update.isPublic = patch.isPublic;

  try {
    const { data, error } = await supabase
      .from("snippets")
      .update(update)
      .eq("id", id)
      .eq("userId", userId) // owner only
      .select()
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      return {
        success: false,
        error: "Snippet not found, or you don't have permission to edit it.",
      };
    }

    revalidateAll();
    return { success: true, data: mapRow(data) };
  } catch (error: unknown) {
    console.error("Failed to update snippet:", error);
    return { success: false, error: errorMessage(error) };
  }
}

/* ---------- DELETE ---------- */

// Only the owner can delete
export async function deleteSnippet(id: string): Promise<ActionResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Sign in to delete snippets." };

  try {
    const { data, error } = await supabase
      .from("snippets")
      .delete()
      .eq("id", id)
      .eq("userId", userId) // owner only
      .select("id");

    if (error) throw error;
    if (!data?.length) {
      return {
        success: false,
        error: "Snippet not found, or you don't have permission to delete it.",
      };
    }

    revalidateAll();
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to delete snippet:", error);
    return { success: false, error: errorMessage(error) };
  }
}
