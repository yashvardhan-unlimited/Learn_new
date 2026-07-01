interface LoadingIndicatorProps {
  label?: string
  light?: boolean
  compact?: boolean
}

// Shared spinner keeps loading feedback consistent throughout the application.
export function LoadingIndicator({ label = 'Loading…', light = false, compact = false }: LoadingIndicatorProps) {
  return (
    <div role="status" aria-live="polite" className={`flex items-center justify-center gap-2 ${compact ? '' : 'py-10'} ${light ? 'text-slate-300' : 'text-slate-500'}`}>
      <span className={`h-5 w-5 animate-spin rounded-full border-2 border-current ${light ? 'border-t-white' : 'border-t-indigo-600'}`} aria-hidden="true" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
