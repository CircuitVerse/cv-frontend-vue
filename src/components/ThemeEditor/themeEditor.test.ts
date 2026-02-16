import { describe, it, expect } from 'vitest'
import themeEditor from '#/plugins/themeEditor'

describe('themeEditor plugin basic API', () => {
  it('exports expected helpers', () => {
    expect(typeof themeEditor.getRootTheme).toBe('function')
    expect(typeof themeEditor.applyTheme).toBe('function')
    expect(typeof themeEditor.saveTheme).toBe('function')
    expect(typeof themeEditor.getAllSavedThemes).toBe('function')
    expect(typeof themeEditor.getDefaultThemes).toBe('function')
  })
})
