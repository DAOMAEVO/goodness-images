import { normalizeBaseUrl } from './devProxy'
import type { ApiMode, AppSettings, SettingsMode } from '../types'
import {
  DEFAULT_IMAGES_MODEL,
  DEFAULT_RESPONSES_MODEL,
  DEFAULT_SETTINGS,
} from '../types'

function parseApiMode(value: string | undefined): ApiMode | null {
  if (value === 'images' || value === 'responses') return value
  return null
}

function parseBooleanEnv(value: string | undefined, fallback = false): boolean {
  if (value == null) return fallback

  const normalized = value.trim().toLowerCase()
  if (normalized === 'true') return true
  if (normalized === 'false') return false
  return fallback
}

function parseNumberEnv(value: string | undefined, fallback: number): number {
  if (value == null) return fallback

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function getDefaultModelForMode(apiMode: ApiMode): string {
  return apiMode === 'responses' ? DEFAULT_RESPONSES_MODEL : DEFAULT_IMAGES_MODEL
}

export function sanitizeSettings(settings: AppSettings): AppSettings {
  const apiMode = settings.apiMode === 'responses' ? 'responses' : DEFAULT_SETTINGS.apiMode

  return {
    ...settings,
    apiMode,
    baseUrl: normalizeBaseUrl(settings.baseUrl.trim() || DEFAULT_SETTINGS.baseUrl),
    apiKey: settings.apiKey,
    model: settings.model.trim() || getDefaultModelForMode(apiMode),
    timeout: Number(settings.timeout) || DEFAULT_SETTINGS.timeout,
    codexCli: Boolean(settings.codexCli),
  }
}

export function mergeSettings(current: AppSettings, patch: Partial<AppSettings>): AppSettings {
  const nextApiMode =
    patch.apiMode === 'images' || patch.apiMode === 'responses'
      ? patch.apiMode
      : current.apiMode

  return sanitizeSettings({
    ...current,
    ...patch,
    apiMode: nextApiMode,
    codexCli: patch.codexCli ?? current.codexCli,
  })
}

const systemApiMode =
  parseApiMode(import.meta.env.VITE_SYSTEM_API_MODE?.trim()) ?? DEFAULT_SETTINGS.apiMode

export const SYSTEM_SETTINGS: AppSettings = sanitizeSettings({
  baseUrl: import.meta.env.VITE_SYSTEM_API_URL?.trim() || DEFAULT_SETTINGS.baseUrl,
  apiKey: import.meta.env.VITE_SYSTEM_API_KEY?.trim() || '',
  model:
    import.meta.env.VITE_SYSTEM_MODEL?.trim() || getDefaultModelForMode(systemApiMode),
  timeout: parseNumberEnv(import.meta.env.VITE_SYSTEM_TIMEOUT, DEFAULT_SETTINGS.timeout),
  apiMode: systemApiMode,
  codexCli: parseBooleanEnv(import.meta.env.VITE_SYSTEM_CODEX_CLI, DEFAULT_SETTINGS.codexCli),
})

export const DEFAULT_SETTINGS_MODE: SettingsMode = SYSTEM_SETTINGS.apiKey ? 'public' : 'custom'

export const isSystemSettingsConfigured = Boolean(SYSTEM_SETTINGS.apiKey.trim())

export function resolveSettings(
  settingsMode: SettingsMode,
  customSettings: AppSettings,
): AppSettings {
  return settingsMode === 'public' ? SYSTEM_SETTINGS : customSettings
}
