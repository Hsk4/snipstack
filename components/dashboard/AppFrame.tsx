"use client";

import {
  DashboardSidebar,
  type Collection,
} from "@/components/dashboard/DashboardSidebar";

interface AppFrameProps {
  active: "library" | "playground";
  workspaceName: string;
  collections: Collection[];
  /** Library page only: filter collections in place instead of linking out. */
  activeCollection?: string | null;
  onSelectCollection?: (name: string | null) => void;
  breadcrumb: string;
  /** Width and vertical rhythm of the content column. */
  contentClassName?: string;
  children: React.ReactNode;
}

/** Full-screen workspace shell: sidebar on the left, scrolling content column on the right. */
export function AppFrame({
  active,
  workspaceName,
  collections,
  activeCollection,
  onSelectCollection,
  breadcrumb,
  contentClassName = "max-w-5xl gap-6",
  children,
}: AppFrameProps) {
  return (
    <div className="fixed inset-0 z-50 flex bg-background text-foreground">
      <DashboardSidebar
        active={active}
        workspaceName={workspaceName}
        collections={collections}
        activeCollection={activeCollection}
        onSelectCollection={onSelectCollection}
      />

      <main className="min-w-0 flex-1 overflow-y-auto">
        <div
          className={`mx-auto flex flex-col px-6 py-5 md:px-8 ${contentClassName}`}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{breadcrumb}</span>
            <span>Personal workspace</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
