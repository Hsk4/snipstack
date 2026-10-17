export type SupportedLanguages =
  | "typescript"
  | "javascript"
  | "python"
  | "go"
  | "rust"
  | "html"
  | "css"
  | "json"
  | "markdown"
  | "sql"
  | "bash";


export interface Snippet {

    id : string;
    userId: string ;
    title: string ;
    description?: string ;
    code : string ;
    language : SupportedLanguages ;
    tags : string [];
    isPublic : boolean ;
    createdAt : Date ;
    updatedAt : Date ;
}

export type CreateSnippetInput = Omit<Snippet, "id" | "userId" | "createdAt" | "updatedAt">;


export type UpdateSnippetInput = Partial<CreateSnippetInput> & {
  id: string;
};
