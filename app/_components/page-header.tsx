import type { ReactNode } from "react";

type PageHeaderProps = {
  section: string;
  title: ReactNode;
  icon: ReactNode;
};

export function PageHeader({ section, title, icon }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">{section}</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
      </div>

      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</div>
    </header>
  );
}