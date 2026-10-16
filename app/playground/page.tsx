import { CodePlayground } from "@/components/CodePlayground";

export default function PlaygroundPage() {
    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                    Interactive Code Playground
                </h1>
                <p className="text-sm text-muted-foreground">
                    Execute client-side JavaScript, inspect JSON schemas, or render live HTML/CSS previews before saving to SnippetVault.
                </p>
            </div>

            <CodePlayground />
        </div>
    );
}