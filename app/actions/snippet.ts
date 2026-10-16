import { supabase } from "@/lib/Supabase";
import type { Snippet } from "@/app/types";

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
    return { success: true, data };
  } catch (error: unknown) {
    console.error('Failed to create snippet:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}