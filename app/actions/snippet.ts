"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { RowDataPacket } from "mysql2";
import pool, { initDb } from "@/lib/db";
import { Snippet } from "@/app/types";

// MySQL row interface extending RowDataPacket for strict typing
interface SnippetRow extends RowDataPacket {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  code: string;
  language: string;
  tags: string | null;
  isPublic: boolean | number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Utility to map raw DB row to Snippet interface
function mapRowToSnippet(row: SnippetRow): Snippet {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description || undefined,
    code: row.code,
    language: row.language as Snippet["language"],
    tags: row.tags ? row.tags.split(",") : [],
    isPublic: Boolean(row.isPublic),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

// 1. CREATE Snippet
export async function createSnippet(data: {
  title: string;
  description?: string;
  code: string;
  language: string;
  tags: string[];
  isPublic?: boolean;
}) {
  await initDb();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const id = crypto.randomUUID();
  const tagsString = data.tags.join(",");
  const isPublic = data.isPublic ?? false;

  const query = `
    INSERT INTO snippets (id, userId, title, description, code, language, tags, isPublic)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await pool.execute(query, [
    id,
    userId,
    data.title,
    data.description || null,
    data.code,
    data.language,
    tagsString,
    isPublic,
  ]);

  revalidatePath("/dashboard");
  return { success: true, snippetId: id };
}

// 2. READ All User Snippets
export async function getUserSnippets(): Promise<Snippet[]> {
  await initDb();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const query = `
    SELECT * FROM snippets 
    WHERE userId = ? 
    ORDER BY createdAt DESC
  `;

  const [rows] = await pool.execute<SnippetRow[]>(query, [userId]);
  return rows.map(mapRowToSnippet);
}

// 3. READ Single Snippet
export async function getSnippetById(id: string): Promise<Snippet | null> {
  await initDb();
  const { userId } = await auth();

  const query = `SELECT * FROM snippets WHERE id = ?`;
  const [rows] = await pool.execute<SnippetRow[]>(query, [id]);
  const snippet = rows[0];

  if (!snippet) return null;

  // Authorization check for private snippets
  if (!snippet.isPublic && snippet.userId !== userId) {
    throw new Error("Forbidden");
  }

  return mapRowToSnippet(snippet);
}

// 4. DELETE Snippet
export async function deleteSnippet(id: string) {
  await initDb();
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const query = `DELETE FROM snippets WHERE id = ? AND userId = ?`;
  await pool.execute(query, [id, userId]);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPublicSnippets(): Promise<Snippet[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      "SELECT id, userId, title, description, code, language, tags, isPublic, createdAt FROM snippets WHERE isPublic = true ORDER BY createdAt DESC",
    );
    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      code: row.code,
      language: row.language,
      // Fix inside getPublicSnippets array parsing:
      tags: row.tags ? row.tags.split(",") : [],

      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error: unknown) {
    console.error("Failed to fetch public snippets:", error);
    return [];
  }
}
