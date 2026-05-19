import { describe, expect, it } from 'vitest'
import { defaultEditorConfig } from '@shared/config/settings'
import type { EditorConfig } from '@shared/config/types'
import {
  getBackgroundInitIdleTimeoutMs,
  getChatHistoryWindow,
  getEffectiveFileChangeDebounceMs,
  getEffectiveFlushIntervalMs,
  getEffectiveTerminalRendererMode,
  getPreviewDiscoveryDelayMs,
  isLowSpecModeEnabled,
  shouldPreloadDirectoryChildren,
} from '@/renderer/performance/lowSpec'

function withPerformance(overrides: Partial<EditorConfig['performance']>): EditorConfig {
  return {
    ...defaultEditorConfig,
    performance: {
      ...defaultEditorConfig.performance,
      ...overrides,
    },
  }
}

describe('lowSpec helpers', () => {
  it('keeps default behavior when low-spec mode is disabled', () => {
    const config = withPerformance({
      lowSpecMode: false,
      terminalRendererMode: 'auto',
      fileChangeDebounceMs: 300,
      flushIntervalMs: 5000,
    })

    expect(isLowSpecModeEnabled(config)).toBe(false)
    expect(getEffectiveTerminalRendererMode(config)).toBe('webgl')
    expect(getEffectiveFileChangeDebounceMs(config)).toBe(300)
    expect(getEffectiveFlushIntervalMs(config)).toBe(5000)
    expect(getPreviewDiscoveryDelayMs(config)).toBe(1200)
    expect(getBackgroundInitIdleTimeoutMs(config)).toBe(2000)
    expect(getChatHistoryWindow(config)).toEqual({
      revealBatchSize: 50,
      visibleTailCount: 100,
    })
    expect(shouldPreloadDirectoryChildren(config)).toBe(true)
  })

  it('applies conservative defaults when low-spec mode is enabled', () => {
    const config = withPerformance({
      lowSpecMode: true,
      terminalRendererMode: 'auto',
      fileChangeDebounceMs: 300,
      flushIntervalMs: 5000,
    })

    expect(isLowSpecModeEnabled(config)).toBe(true)
    expect(getEffectiveTerminalRendererMode(config)).toBe('dom')
    expect(getEffectiveFileChangeDebounceMs(config)).toBe(650)
    expect(getEffectiveFlushIntervalMs(config)).toBe(10000)
    expect(getPreviewDiscoveryDelayMs(config)).toBe(2500)
    expect(getBackgroundInitIdleTimeoutMs(config)).toBe(5000)
    expect(getChatHistoryWindow(config)).toEqual({
      revealBatchSize: 24,
      visibleTailCount: 60,
    })
    expect(shouldPreloadDirectoryChildren(config)).toBe(false)
  })

  it('respects explicit terminal renderer overrides', () => {
    const domConfig = withPerformance({
      lowSpecMode: false,
      terminalRendererMode: 'dom',
    })
    const webglConfig = withPerformance({
      lowSpecMode: true,
      terminalRendererMode: 'webgl',
    })

    expect(getEffectiveTerminalRendererMode(domConfig)).toBe('dom')
    expect(getEffectiveTerminalRendererMode(webglConfig)).toBe('webgl')
  })
})
