<template>
  <div class="live-theme-editor">
    <h3>Live Theme Editor</h3>
    <div class="editor-grid">
      <div class="vars">
        <div v-for="(val, key) in variables" :key="key" class="var-row">
          <label class="var-key">{{ key }}</label>
          <input
            v-if="isColor(val)"
            type="color"
            :value="toHex(val)"
            @input="onChange(key, ($event.target as HTMLInputElement).value)"
          />
          <input
            v-else
            type="text"
            :value="val"
            @input="onChange(key, ($event.target as HTMLInputElement).value)"
          />
          <span class="var-val">{{ val }}</span>
        </div>
      </div>
      <div class="controls">
        <ThemePicker />
        <div class="preview">
          <h4>Preview</h4>
          <div class="preview-box">
            <div class="preview-navbar">CircuitVerse Preview</div>
            <div class="preview-panel">
              <button class="custom-btn--primary">Primary</button>
              <button class="custom-btn--secondary">Secondary</button>
            </div>
            <div class="preview-canvas">wire • node • text</div>
          </div>
          <div class="contrast-status">
            <strong>Contrast:</strong>
            <span :style="{color: contrastOk ? 'green' : 'crimson'}">{{ contrastText }}</span>
          </div>
        </div>
        <div class="save">
          <input v-model="themeName" placeholder="Theme name" />
          <button @click="save">Save Theme</button>
          <button @click="exportCurrent">Export</button>
          <input ref="importFile" type="file" style="display:none" @change="handleImportFile" />
          <button @click="triggerImport">Import</button>
        </div>
        <div class="saved">
          <h4>Saved Themes</h4>
          <ul>
            <li v-for="(t, name) in savedThemes" :key="name">
              <span>{{ name }}</span>
              <button @click="apply(name)">Apply</button>
              <button @click="remove(name)">Delete</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from "vue"
import themeEditor, { ThemeMap } from "#/plugins/themeEditor"
import ThemePicker from "./ThemePicker.vue"

const variables = reactive<ThemeMap>({})
const savedThemes = reactive<Record<string, ThemeMap>>({})
const themeName = ref("")
const contrastText = ref("")
const contrastOk = ref(true)

function normalize(v: string) {
  return v.trim()
}

function isColorString(v: string) {
  if (!v) return false
  // basic checks for hex, rgb, rgba
  return /^#/.test(v) || /^rgb/.test(v)
}

function toHex(v: string) {
  // try to normalize hex or rgb(...) to 6-digit hex if possible; else return v
  try {
    const normalized = v.trim()
    // Handle 6-digit hex
    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) return normalized
    // Handle 8-digit hex with alpha
    if (/^#[0-9a-fA-F]{8}$/.test(normalized)) return normalized
    // Handle 4-digit hex with alpha (#rgba)
    if (/^#[0-9a-fA-F]{4}$/.test(normalized)) {
      return "#" + Array.from(normalized.slice(1)).map(c => c + c).join("")
    }
    // Handle 3-digit hex (#rgb)
    if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
      return "#" + Array.from(normalized.slice(1)).map(c => c + c).join("")
    }
    if (/^rgb/.test(normalized)) {
      const nums = normalized.replace(/rgba?\(|\)/g, "").split(",").map(s => parseInt(s.trim(), 10))
      return "#" + nums.slice(0, 3).map(n => n.toString(16).padStart(2, "0")).join("")
    }
  } catch (e) {}
  return v
}

function isColor(v: string) {
  return isColorString(v)
}

function onChange(key: string, val: string) {
  variables[key] = normalize(val)
  // apply with transition for smoothness
  themeEditor.applyThemeWithTransition({ [key]: variables[key] })
  checkContrast()
}

function save() {
  if (!themeName.value) return
  themeEditor.saveTheme(themeName.value, { ...variables })
  Object.assign(savedThemes, themeEditor.getAllSavedThemes())
  themeName.value = ''
}

function apply(name: string) {
  const t = themeEditor.loadAndApplyTheme(name)
  if (t) {
    // Clear old theme keys before applying new theme
    for (const k in variables) delete variables[k]
    Object.assign(variables, t)
  }
  checkContrast()
}

function remove(name: string) {
  themeEditor.deleteTheme(name)
  const all = themeEditor.getAllSavedThemes()
  for (const k in savedThemes) delete savedThemes[k]
  Object.assign(savedThemes, all)
}

onMounted(() => {
  const root = themeEditor.getRootTheme()
  Object.assign(variables, root)
  Object.assign(savedThemes, themeEditor.getAllSavedThemes())
  checkContrast()
})

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // Convert HSL (h: 0-360, s: 0-100, l: 0-100) to RGB (0-255)
  h = h % 360
  if (h < 0) h += 360
  s = s / 100
  l = l / 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0

  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x
  }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255),
  ]
}

function luminance(hexOrRgb: string) {
  try {
    let r = 0, g = 0, b = 0
    const normalized = hexOrRgb.trim()
    if (normalized.startsWith("#")) {
      let hex = normalized.replace("#", "")
      // Handle 3-digit hex: expand by duplicating each character
      if (hex.length === 3) {
        hex = Array.from(hex).map(c => c + c).join("")
      }
      r = parseInt(hex.substring(0, 2), 16)
      g = parseInt(hex.substring(2, 4), 16)
      b = parseInt(hex.substring(4, 6), 16)
    } else if (normalized.startsWith("rgb")) {
      const nums = normalized.replace(/rgba?\(|\)/g, "").split(",").map(s => parseFloat(s))
      r = nums[0]; g = nums[1]; b = nums[2]
    } else if (normalized.startsWith("hsl")) {
      // Handle HSL/HSLA: hsla(h, s%, l%, a) or hsl(h, s%, l%)
      const match = normalized.match(/hsla?\(([^)]+)\)/)
      if (match) {
        const parts = match[1].split(",").map(s => parseFloat(s.trim()))
        if (parts.length >= 3) {
          const [h, s, l] = parts
          const [rgb_r, rgb_g, rgb_b] = hslToRgb(h, s, l)
          r = rgb_r; g = rgb_g; b = rgb_b
        }
      }
    }
    const Rs = r / 255; const Gs = g / 255; const Bs = b / 255
    const R = Rs <= 0.03928 ? Rs / 12.92 : Math.pow((Rs + 0.055) / 1.055, 2.4)
    const G = Gs <= 0.03928 ? Gs / 12.92 : Math.pow((Gs + 0.055) / 1.055, 2.4)
    const B = Bs <= 0.03928 ? Bs / 12.92 : Math.pow((Bs + 0.055) / 1.055, 2.4)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  } catch(e){ return 0 }
}

function contrastRatio(a: string, b: string) {
  const la = luminance(a)
  const lb = luminance(b)
  const L1 = Math.max(la, lb)
  const L2 = Math.min(la, lb)
  return (L1 + 0.05) / (L2 + 0.05)
}

function checkContrast() {
  const text = variables['--text'] || variables['--text-panel'] || variables['--text-lite'] || '#000'
  const bg = variables['--primary'] || variables['--bg-navbar'] || '#fff'
  const ratio = contrastRatio(text.toString(), bg.toString())
  contrastOk.value = ratio >= 4.5
  contrastText.value = `${Math.round(ratio*10)/10}: ${contrastOk.value ? 'Good (>=4.5)' : 'Low (<4.5)'}`
}

const importFile = ref<HTMLInputElement | null>(null)

function triggerImport() {
  importFile.value?.click()
}

function handleImportFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  const reader = new FileReader()
  reader.onload = () => {
    try {
      const parsed = themeEditor.importThemeFromJSON(String(reader.result))
      if (parsed) {
        // Explicitly save the imported theme
        themeEditor.saveTheme(parsed.name, parsed.theme)
        Object.assign(savedThemes, themeEditor.getAllSavedThemes())
        // Reset file input
        if (importFile.value) {
          importFile.value.value = ""
        }
      } else {
        alert("Invalid theme file format. Please check the file and try again.")
      }
    } catch (err) {
      console.error("Error importing theme:", err)
      alert("Failed to import theme. Please check the file format.")
    }
  }
  reader.onerror = () => {
    console.error("Error reading file")
    alert("Failed to read file. Please try again.")
  }
  reader.readAsText(f)
}

function exportCurrent() {
  const name = themeName.value || 'theme'
  const s = themeEditor.exportTheme(name, { ...variables })
  const blob = new Blob([s], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name + '.json'
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.live-theme-editor { padding: 12px; }
.editor-grid { display: flex; gap: 16px; }
.vars { flex: 1; max-height: 60vh; overflow: auto; border: 1px solid #ddd; padding: 8px }
.var-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px }
.var-key { width: 220px; font-family: monospace; font-size: 13px }
.var-val { color: #666; font-size: 12px }
.controls { width: 300px }
.preview-box { height: 140px; border-radius: 6px; border: 1px solid var(--br-secondary); display:flex; flex-direction:column; gap:8px; padding:8px }
.preview-navbar { width:100%; padding:6px 10px; background:var(--bg-navbar); color:var(--text-lite); border-radius:4px }
.preview-panel { display:flex; gap:8px; align-items:center }
.preview-canvas { margin-top:6px; padding:8px; background:var(--canvas-fill); color:var(--text); border-radius:4px; border:1px solid var(--canvas-stroke) }
.save { margin-top: 12px; display:flex; gap:8px }
.save input { flex:1 }
.saved ul { list-style:none; padding:0; margin:0 }
.saved li { display:flex; gap:8px; align-items:center; margin:6px 0 }
</style>
