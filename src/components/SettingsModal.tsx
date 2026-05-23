import { useCallback, useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react'
import { clearAllData, exportData, importData, useStore } from '../store'
import {
  DEFAULT_IMAGES_MODEL,
  DEFAULT_RESPONSES_MODEL,
  DEFAULT_SETTINGS,
  type AppSettings,
} from '../types'
import { getDefaultModelForMode, mergeSettings } from '../lib/settings'
import { useCloseOnEscape } from '../hooks/useCloseOnEscape'
import Select from './Select'

export default function SettingsModal() {
  const showSettings = useStore((s) => s.showSettings)
  const setShowSettings = useStore((s) => s.setShowSettings)
  const customSettings = useStore((s) => s.customSettings)
  const setSettings = useStore((s) => s.setSettings)
  const setConfirmDialog = useStore((s) => s.setConfirmDialog)
  const importInputRef = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState<AppSettings>(customSettings)
  const [timeoutInput, setTimeoutInput] = useState(String(customSettings.timeout))
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    if (showSettings) {
      setDraft(customSettings)
      setTimeoutInput(String(customSettings.timeout))
    }
  }, [customSettings, showSettings])

  const commitSettings = (nextDraft: AppSettings) => {
    const normalizedDraft = mergeSettings(DEFAULT_SETTINGS, nextDraft)
    setDraft(normalizedDraft)
    setSettings(normalizedDraft)
  }

  const handleClose = () => {
    const nextTimeout = Number(timeoutInput)
    commitSettings({
      ...draft,
      timeout:
        timeoutInput.trim() === '' || Number.isNaN(nextTimeout)
          ? DEFAULT_SETTINGS.timeout
          : nextTimeout,
    })
    setShowSettings(false)
  }

  const commitTimeout = useCallback(() => {
    const nextTimeout = Number(timeoutInput)
    const normalizedTimeout =
      timeoutInput.trim() === ''
        ? DEFAULT_SETTINGS.timeout
        : Number.isNaN(nextTimeout)
          ? draft.timeout
          : nextTimeout
    setTimeoutInput(String(normalizedTimeout))
    commitSettings({ ...draft, timeout: normalizedTimeout })
  }, [draft, timeoutInput])

  useCloseOnEscape(showSettings, handleClose)

  if (!showSettings) return null

  const handleImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) importData(file)
    event.target.value = ''
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md animate-overlay-in"
        onClick={handleClose}
      />
      <div className="relative z-10 max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-[34px] border border-white/10 bg-[#111117]/96 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-white/6 animate-modal-in">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="panel-kicker">Settings</div>
            <h3 className="mt-2 text-2xl font-semibold text-white">接口与数据设置</h3>
            <p className="mt-2 text-sm leading-7 text-white/54">
              配置 API 参数，并管理本地记录与图片数据。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-white/42">
              v{__APP_VERSION__}
            </span>
            <button
              onClick={handleClose}
              className="rounded-full border border-white/10 bg-white/6 p-2 text-white/58 transition hover:border-white/16 hover:text-white"
              aria-label="关闭"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-[28px] border border-white/10 bg-black/18 p-5">
            <div className="mb-4 text-sm font-medium text-white">API 配置</div>
            <div className="space-y-4">
              <Field label="API URL">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-white/30">
                    endpoint
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextDraft = { ...draft, codexCli: !draft.codexCli }
                      setDraft(nextDraft)
                      commitSettings(nextDraft)
                    }}
                    className="inline-flex items-center gap-2 text-xs text-white/58"
                  >
                    <span>Codex CLI</span>
                    <span
                      className={`relative inline-flex h-4 w-8 rounded-full transition ${
                        draft.codexCli ? 'bg-[#ff4eb7]' : 'bg-white/14'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition ${
                          draft.codexCli ? 'left-4.5' : 'left-0.5'
                        }`}
                      />
                    </span>
                  </button>
                </div>
                <input
                  value={draft.baseUrl}
                  onChange={(event) => setDraft((prev) => ({ ...prev, baseUrl: event.target.value }))}
                  onBlur={(event) => commitSettings({ ...draft, baseUrl: event.target.value })}
                  type="text"
                  placeholder={DEFAULT_SETTINGS.baseUrl}
                  className="panel-field"
                />
              </Field>

              <Field label="API Key">
                <div className="relative">
                  <input
                    value={draft.apiKey}
                    onChange={(event) => setDraft((prev) => ({ ...prev, apiKey: event.target.value }))}
                    onBlur={(event) => commitSettings({ ...draft, apiKey: event.target.value })}
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="sk-..."
                    className="panel-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((value) => !value)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/42 transition hover:text-white"
                    tabIndex={-1}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showApiKey ? (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      ) : (
                        <>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.88 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 2l20 20" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="接口模式">
                  <Select
                    value={draft.apiMode ?? DEFAULT_SETTINGS.apiMode}
                    onChange={(value) => {
                      const apiMode = value as AppSettings['apiMode']
                      const nextModel =
                        draft.model === DEFAULT_IMAGES_MODEL || draft.model === DEFAULT_RESPONSES_MODEL
                          ? getDefaultModelForMode(apiMode)
                          : draft.model
                      const nextDraft = { ...draft, apiMode, model: nextModel }
                      setDraft(nextDraft)
                      commitSettings(nextDraft)
                    }}
                    options={[
                      { label: 'Images API (/v1/images)', value: 'images' },
                      { label: 'Responses API (/v1/responses)', value: 'responses' },
                    ]}
                    className="panel-field text-white"
                  />
                </Field>

                <Field label="模型 ID">
                  <input
                    value={draft.model}
                    onChange={(event) => setDraft((prev) => ({ ...prev, model: event.target.value }))}
                    onBlur={(event) => commitSettings({ ...draft, model: event.target.value })}
                    type="text"
                    placeholder={getDefaultModelForMode(draft.apiMode ?? DEFAULT_SETTINGS.apiMode)}
                    className="panel-field"
                  />
                </Field>
              </div>

              <Field label="请求超时（秒）">
                <input
                  value={timeoutInput}
                  onChange={(event) => setTimeoutInput(event.target.value)}
                  onBlur={commitTimeout}
                  type="number"
                  min={10}
                  max={600}
                  className="panel-field"
                />
              </Field>

              <div className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-xs leading-6 text-white/52">
                {(draft.apiMode ?? DEFAULT_SETTINGS.apiMode) === 'responses'
                  ? `Responses API 需要使用支持 image_generation 工具的文本模型，例如 ${DEFAULT_RESPONSES_MODEL}。`
                  : `Images API 推荐使用 GPT Image 模型，例如 ${DEFAULT_IMAGES_MODEL}。`}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-black/18 p-5">
            <div className="mb-4 text-sm font-medium text-white">数据管理</div>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={() => exportData()}
                className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
              >
                导出记录
              </button>
              <button
                onClick={() => importInputRef.current?.click()}
                className="rounded-[20px] border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/72 transition hover:bg-white/10 hover:text-white"
              >
                导入记录
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={handleImport}
              />
            </div>

            <button
              onClick={() =>
                setConfirmDialog({
                  title: '清空所有数据',
                  message: '确定要清空所有任务记录和图片数据吗？此操作不可恢复。',
                  action: () => void clearAllData(),
                })
              }
              className="mt-4 w-full rounded-[20px] border border-red-400/18 bg-red-500/10 px-4 py-3 text-sm text-red-100 transition hover:bg-red-500/14"
            >
              清空所有数据
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

function Field({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="panel-label">{label}</span>
      {children}
    </label>
  )
}
