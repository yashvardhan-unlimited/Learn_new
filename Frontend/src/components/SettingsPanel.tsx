import { useEffect, useState, type ReactNode } from 'react'
import { connectGoogle, disconnectGoogle, getGoogleStatus, type GoogleStatus } from '../api/google'

interface Props {
  open: boolean; onClose: () => void; appearance: 'light' | 'dark' | 'space'; onAppearanceChange: (value: 'light' | 'dark' | 'space') => void
  confirmDelete: boolean; onConfirmDeleteChange: (value: boolean) => void
  confirmAi: boolean; onConfirmAiChange: (value: boolean) => void
}

export function SettingsPanel(props: Props) {
  const { open, onClose, appearance, onAppearanceChange, confirmDelete, onConfirmDeleteChange, confirmAi, onConfirmAiChange } = props
  const [google, setGoogle] = useState<GoogleStatus | null>(null)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    void getGoogleStatus().then(setGoogle).catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load Google status.'))
  }, [open])
  useEffect(() => {
    if (!open) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [open, onClose])

  if (!open) return null

  async function changeGoogleConnection() {
    setGoogleBusy(true); setError('')
    try {
      if (google?.connected) { await disconnectGoogle(); setGoogle({ connected: false, calendar: false, gmail: false }) }
      else { const response = await connectGoogle(); window.location.assign(response.redirect_url) }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to update Google connection.') }
    finally { setGoogleBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center p-4">
      <button aria-label="Close settings" onClick={onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="settings-title" className="relative max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white/90 p-5 shadow-2xl backdrop-blur-2xl dark:border-slate-700 dark:bg-slate-900/95 sm:p-7">
        <header className="mb-6 flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Preferences</p><h2 id="settings-title" className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">Settings</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Control behavior, appearance, and integrations.</p></div><button onClick={onClose} aria-label="Close settings" className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-xl text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">×</button></header>
        <div className="space-y-4">
          <SettingRow title="Appearance" description="Choose a clean light, focused dark, or immersive space theme.">
            <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-950">{(['light', 'dark', 'space'] as const).map((theme) => <button key={theme} onClick={() => onAppearanceChange(theme)} className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition ${appearance === theme ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>{theme === 'space' ? '✦ ' : ''}{theme}</button>)}</div>
          </SettingRow>
          <SettingRow title="Confirm before deleting tasks" description="When off, Delete removes a task immediately."><Switch checked={confirmDelete} onChange={() => onConfirmDeleteChange(!confirmDelete)} /></SettingRow>
          <SettingRow title="Confirm AI tool actions" description="Ask before the assistant changes tasks or uses connected tools."><Switch checked={confirmAi} onChange={() => onConfirmAiChange(!confirmAi)} /></SettingRow>
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/70">
            <div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white font-bold text-blue-600 shadow-sm dark:bg-slate-700">G</span><div><h3 className="font-bold text-slate-800 dark:text-white">Google Workspace</h3><p className="text-xs text-slate-500 dark:text-slate-400">Calendar events and Gmail drafts</p></div></div>{google?.connected && <div className="mt-3 flex gap-2"><Badge active={google.calendar}>Calendar</Badge><Badge active={google.gmail}>Gmail</Badge></div>}</div><button disabled={googleBusy || google === null} onClick={() => void changeGoogleConnection()} className={`rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${google?.connected ? 'border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700'}`}>{googleBusy ? 'Please wait…' : google?.connected ? 'Disconnect' : 'Connect Google'}</button></div>
          </div>
        </div>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">{error}</p>}
        <p className="mt-5 text-xs leading-5 text-slate-400">Preferences are stored on this device. Google tokens are stored by your backend and are never exposed to the browser.</p>
      </section>
    </div>
  )
}

function SettingRow({ title, description, children }: { title: string; description: string; children: ReactNode }) { return <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4 dark:border-slate-700 dark:bg-slate-800/70"><div><h3 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h3><p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p></div>{children}</div> }
function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) { return <button type="button" role="switch" aria-checked={checked} onClick={onChange} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}><span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} /></button> }
function Badge({ active, children }: { active: boolean; children: ReactNode }) { return <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${active ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-700'}`}>{children}</span> }
