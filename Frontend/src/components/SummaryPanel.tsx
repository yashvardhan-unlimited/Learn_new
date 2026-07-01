import { useState } from 'react'
import { summarizeTasks } from '../api/tasks'
import { LoadingIndicator } from './LoadingIndicator'

export function SummaryPanel() {
  // These three independent state values control displayed text and UI feedback.
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSummarize() {
    // Clear the previous attempt before starting a new streamed response.
    setSummary('')
    setError('')
    setLoading(true)
    try {
      // The callback runs for every streamed piece. Passing a function to
      // setSummary guarantees React appends to the latest state value.
      await summarizeTasks((chunk) => setSummary((current) => current + chunk))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to summarize tasks')
    } finally {
      setLoading(false)
    }
  }

  return (
    <aside className="flex min-h-[420px] flex-col bg-slate-900 p-6 text-white lg:h-screen lg:min-h-0 lg:overflow-hidden lg:p-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">AI assistant</p>
        <h2 className="mt-2 text-2xl font-bold">Task summary</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Get a live AI-generated overview of your current workload.</p>
      </div>
      <button onClick={() => void handleSummarize()} disabled={loading} className="mt-7 w-full rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold shadow-lg shadow-indigo-950/30 hover:bg-indigo-400 disabled:cursor-wait disabled:opacity-70">
        {loading ? <LoadingIndicator label="Summarizing…" light compact /> : 'Summarize my tasks'}
      </button>
      <div aria-live="polite" className="mt-6 min-h-0 flex-1 overflow-y-auto rounded-xl border border-slate-700 bg-slate-800/60 p-4">
        {/* aria-live asks screen readers to announce content as it changes. */}
        {error && <p className="text-sm text-red-300">{error}</p>}
        {!error && !summary && !loading && <p className="text-sm leading-6 text-slate-500">Your summary will appear here as it is generated.</p>}
        {summary && <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{summary}</p>}
        {loading && summary && <div className="mt-4"><LoadingIndicator label="Receiving summary…" light compact /></div>}
        {loading && !summary && <LoadingIndicator label="Waiting for AI…" light />}
      </div>
    </aside>
  )
}
