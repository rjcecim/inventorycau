export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-16 text-center">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}
