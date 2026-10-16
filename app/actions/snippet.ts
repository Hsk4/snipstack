"use server";
import type { Snippet, UpdateSnippetInput } from "@/app/types";
import {supabase} from "@/lib/supabase";
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

// Fetch public snippets for the discovery feed
export async function getPublicSnippets(): Promise<Snippet[]> {
  try {
    const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('isPublic', true)
        .order('createdAt', { ascending: false });

    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      code: row.code,
      language: row.language,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch public snippets:', error);
    return [];
  }
}

// Fetch snippets for a specific user
export async function getUserSnippets(): Promise<Snippet[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

    if (error) {
      console.error('Supabase error fetching user snippets:', error);
      throw error;
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.userId,
      title: row.title,
      description: row.description,
      code: row.code,
      language: row.language,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || []),
      isPublic: Boolean(row.isPublic),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch user snippets:', error);
    return [];
  }
}

// Get a single snippet by ID
export async function getSnippetById(id: string): Promise<Snippet | null> {
  try {
    const { data, error } = await supabase
        .from('snippets')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
      console.error('Supabase error fetching user snippets:', JSON.stringify(error, null, 2));
      throw error;
    }    if (!data) return null;

    return {
      id: data.id,
      userId: data.userId,
      title: data.title,
      description: data.description,
      code: data.code,
      language: data.language,
      tags: typeof data.tags === 'string' ? JSON.parse(data.tags) : (data.tags || []),
      isPublic: Boolean(data.isPublic),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  } catch (error: unknown) {
    console.error('Failed to fetch snippet:', error);
    return null;
  }
}

// Create a new snippet
export async function createSnippet(formData: {
  userId: string;
  title: string;
  description: string;
  code: string;
  language: string;
  tags: string[];
  isPublic: boolean;
}) {
  try {
    const { data, error } = await supabase
        .from('snippets')
        .insert([
          {
            userId: formData.userId,
            title: formData.title,
            description: formData.description,
            code: formData.code,
            language: formData.language,
            tags: formData.tags,
            isPublic: formData.isPublic,
          },
        ])
        .select();

    if (error) throw error;
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, data };
  } catch (error: unknown) {
    console.error('Failed to create snippet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Update an existing snippet
export async function updateSnippet(input: UpdateSnippetInput) {
  try {
    const { id, ...updateData } = input;
    const { data, error } = await supabase
        .from('snippets')
        .update(updateData)
        .eq('id', id)
        .select();

    if (error) throw error;
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true, data };
  } catch (error: unknown) {
    console.error('Failed to update snippet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Delete a snippet
export async function deleteSnippet(id: string) {
  try {
    const { error } = await supabase
        .from('snippets')
        .delete()
        .eq('id', id);

    if (error) throw error;
    revalidatePath('/dashboard');
    revalidatePath('/');
    return { success: true };
  } catch (error: unknown) {
    console.error('Failed to delete snippet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}