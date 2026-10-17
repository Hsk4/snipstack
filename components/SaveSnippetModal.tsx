"use client";

import { useState } from "react";
import { createSnippet } from "@/app/actions/snippet"; // Adjust import path to your actions file
import { Save, Loader2, X } from "lucide-react";

interface SaveSnippetModalProps {
    isOpen: boolean;
    onClose: () => void;
    code: string;
    language: string;
    userId: string; // Pass the authenticated Clerk user ID
}

export function SaveSnippetModal({ isOpen, onClose, code, language, userId }: SaveSnippetModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [isPublic, setIsPublic] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            await createSnippet({
                userId,
                title,
                description,
                code,
                language,
                isPublic,
                tags: []
            });
            onClose();
            setTitle("");
            setDescription("");
            alert("Snippet saved successfully to your vault!");
        } catch (err) {
            console.error("Failed to save snippet:", err);
            alert("Failed to save snippet.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Save className="w-5 h-5 text-sky-400" />
                    Save to SnippetVault
                </h2>

                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Snippet Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g., Async User Fetcher"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Description (Optional)</label>
                        <textarea
                            placeholder="Brief summary of what this code does..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 h-20 resize-none"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isPublic"
                            checked={isPublic}
                            onChange={(e) => setIsPublic(e.target.checked)}
                            className="rounded border-zinc-800 bg-zinc-950 text-sky-600 focus:ring-0 cursor-pointer"
                        />
                        <label htmlFor="isPublic" className="text-xs text-zinc-300 cursor-pointer">
                            Make this snippet public (visible to everyone)
                        </label>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition disabled:opacity-50 shadow-lg shadow-sky-600/20"
                        >
                            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                            Save Snippet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}