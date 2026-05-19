import { getEditorConfig } from '@renderer/settings'
import type { EditorConfig, TerminalRendererMode } from '@shared/config/types'

function resolveConfig(config?: EditorConfig): EditorConfig {
  return config ?? getEditorConfig()
}

export function isLowSpecModeEnabled(config?: EditorConfig): boolean {
  return resolveConfig(config).performance.lowSpecMode === true
}

export function getEffectiveTerminalRendererMode(config?: EditorConfig): Exclude<TerminalRendererMode, 'auto'> {
  const resolved = resolveConfig(config)
  const mode = resolved.performance.terminalRendererMode

  if (mode === 'webgl' || mode === 'dom') {
    return mode
  }

  return isLowSpecModeEnabled(resolved) ? 'dom' : 'webgl'
}

export function getEffectiveFileChangeDebounceMs(config?: EditorConfig): number {
  const resolved = resolveConfig(config)
  const base = resolved.performance.fileChangeDebounceMs
  return isLowSpecModeEnabled(resolved) ? Math.max(base, 650) : base
}

export function getEffectiveFlushIntervalMs(config?: EditorConfig): number {
  const resolved = resolveConfig(config)
  const base = resolved.performance.flushIntervalMs
  return isLowSpecModeEnabled(resolved) ? Math.max(base, 10000) : base
}

export function shouldPreloadDirectoryChildren(config?: EditorConfig): boolean {
  return !isLowSpecModeEnabled(config)
}

export function getPreviewDiscoveryDelayMs(config?: EditorConfig): number {
  return isLowSpecModeEnabled(config) ? 2500 : 1200
}

export function getBackgroundInitIdleTimeoutMs(config?: EditorConfig): number {
  return isLowSpecModeEnabled(config) ? 5000 : 2000
}

export function getChatHistoryWindow(config?: EditorConfig): {
  revealBatchSize: number
  visibleTailCount: number
} {
  if (isLowSpecModeEnabled(config)) {
    return {
      revealBatchSize: 24,
      visibleTailCount: 60,
    }
  }

  return {
    revealBatchSize: 50,
    visibleTailCount: 100,
  }
}
