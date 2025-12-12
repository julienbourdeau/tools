# Design System for Code/Data Formatting Tools

## Overview
A clean, modern UI for developer tools with dark/light theme support, syntax highlighting, and a focused single-column layout.

---

## Color Palette

### Dark Theme
| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Background | Gradient slate-900 → slate-800 | `bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900` |
| Input/Output boxes | Semi-transparent slate | `bg-slate-800/50 border-slate-700` |
| Input focus state | Lighter background | `focus:bg-slate-700/50` |
| Primary text | White/light slate | `text-white`, `text-slate-100` |
| Secondary text | Muted slate | `text-slate-400` |
| Labels | Light slate | `text-slate-300` |
| Placeholder text | Dark slate | `placeholder:text-slate-600` |
| Accent color | Amber | `text-amber-400`, `bg-amber-500` |

### Light Theme
| Element | Color | Tailwind Class |
|---------|-------|----------------|
| Background | Gradient slate-100 → white | `bg-gradient-to-br from-slate-100 via-white to-slate-100` |
| Input/Output boxes | White with slate border | `bg-white border-slate-300` |
| Input focus state | Slightly gray | `focus:bg-slate-50` |
| Primary text | Dark slate | `text-slate-800` |
| Secondary text | Medium slate | `text-slate-500` |
| Labels | Medium slate | `text-slate-600` |
| Placeholder text | Light slate | `placeholder:text-slate-400` |
| Accent color | Amber (same) | `text-amber-600`, `bg-amber-500` |

---

## Syntax Highlighting (Prism.js)

### Library Setup
Load Prism.js dynamically from CDN:
```javascript
// Core
https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js

// Language components (load after core)
https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js
https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-ruby.min.js
// Add other languages as needed
```

### Usage
```javascript
const highlighted = window.Prism.highlight(code, window.Prism.languages[lang], lang);
// Render with dangerouslySetInnerHTML
```

### Token Colors

#### Dark Theme
| Token | Color (Hex) |
|-------|-------------|
| Keys/Properties/Symbols | Pink `#f472b6` |
| Strings | Light blue `#a5d6ff` |
| Numbers | Cyan `#79c0ff` |
| Booleans/Keywords | Red-orange `#ff7b72` |
| Punctuation | Slate `#94a3b8` |
| Operators | Orange `#ffa657` |

#### Light Theme
| Token | Color (Hex) |
|-------|-------------|
| Keys/Properties/Symbols | Green `#16a34a` |
| Strings | Blue `#0369a1` |
| Numbers | Sky blue `#0284c7` |
| Booleans/Keywords | Red `#dc2626` |
| Punctuation | Slate `#64748b` |
| Operators | Orange `#ea580c` |

### Required CSS Reset for Prism
```css
.prism-output code[class*="language-"],
.prism-output pre[class*="language-"] {
  background: transparent !important;
  text-shadow: none !important;
  font-size: 0.875rem !important;
}
```

---

## Button Styles

### Primary Action Button
Purpose: Main action (e.g., "Format JSON")
```
bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold rounded-lg px-5 py-2.5
```
- Amber background
- Dark text for contrast
- Includes icon from Lucide React

### Secondary Action Button
Purpose: Alternative action (e.g., "Format Ruby Hash")

**Dark theme:**
```
bg-slate-700 hover:bg-slate-600 text-slate-200
```

**Light theme:**
```
bg-slate-200 hover:bg-slate-300 text-slate-700
```

### Ghost/Clear Button
Purpose: Destructive or tertiary actions (e.g., "Clear")

**Dark theme:**
```
bg-transparent hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 border border-slate-700
```

**Light theme:**
```
bg-transparent hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 border border-slate-300
```

### Icon-Only Button (Theme Toggle)
```
p-2 rounded-lg transition-colors
// Dark: hover:bg-slate-700/50 text-slate-400 hover:text-slate-200
// Light: hover:bg-slate-200/50 text-slate-500 hover:text-slate-700
```

---

## Theme System

### Auto-Detection
```javascript
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
setIsDark(mediaQuery.matches);

// Listen for changes
mediaQuery.addEventListener('change', (e) => setIsDark(e.matches));
```

### Manual Override
```javascript
const [isDark, setIsDark] = useState(true);
const [manualTheme, setManualTheme] = useState(null); // null = follow system

const toggleTheme = () => {
  const newTheme = !isDark;
  setIsDark(newTheme);
  setManualTheme(newTheme ? 'dark' : 'light'); // Lock to manual choice
};

// In useEffect, only follow system if manualTheme === null
```

### Theme Toggle Button
- Position: Top right corner
- Icon: Sun (☀️) in dark mode, Moon (🌙) in light mode
- Uses Lucide React icons: `Sun`, `Moon`

---

## Layout Structure

### Container
```
min-h-screen [background-gradient] p-6
  └── max-w-4xl mx-auto
```

### Sections (top to bottom)
1. **Theme toggle** (top right)
2. **Header** (centered title + subtitle)
3. **Input area** (full width textarea)
4. **Action buttons** (centered row)
5. **Output area** (full width, with label + badge + copy button)
6. **Documentation footer** (supported formats grid)

### Input/Output Fields
```
min-h-[200px] border rounded-xl p-4 font-mono text-sm resize-none
focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50
```

Ensure text wrapping:
```
whitespace-pre-wrap break-words break-all overflow-x-hidden w-full
```

---

## Interactive Elements

### Execution Model
- **Manual execution**: User clicks a button to process input
- Buttons between input and output for clear workflow
- Multiple output formats supported via separate buttons

### Copy to Clipboard
```javascript
await navigator.clipboard.writeText(output);
```
- Small button in output header
- Shows "Copy" with copy icon, changes to "Copied!" with checkmark for 2 seconds
- Uses Lucide icons: `Copy`, `Check`

### Status Badges
Display output format type next to "Output" label:
```
text-xs px-2 py-0.5 rounded

// JSON badge (dark): bg-emerald-500/20 text-emerald-400
// JSON badge (light): bg-emerald-100 text-emerald-700

// Ruby badge (dark): bg-red-500/20 text-red-400
// Ruby badge (light): bg-red-100 text-red-700
```

### Info Messages
Show conversion notes (e.g., "Converted from Ruby hash syntax"):
```
text-xs text-amber-400 mb-3 pb-2 border-b border-slate-700  // dark
text-xs text-amber-600 mb-3 pb-2 border-b border-slate-300  // light
```

### Error Display
```javascript
<div className="flex items-start gap-2 text-red-400">
  <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
  <span className="text-sm">{error}</span>
</div>
```

---

## Documentation Footer

### Purpose
Show users supported input formats with examples.

### Structure
```
mt-8 p-4 rounded-xl border
// Dark: bg-slate-800/30 border-slate-700/50
// Light: bg-slate-100/50 border-slate-200

  └── Grid: md:grid-cols-2 gap-3
        └── Example boxes: p-2 rounded
            // Dark: bg-slate-800/50
            // Light: bg-white
```

### Content Pattern
```
<div className="text-xs font-mono">
  <div className="[muted-color] mb-1">Format Name</div>
  <div className="[text-color]">{`example code`}</div>
</div>
```

---

## Icons (Lucide React)

```javascript
import { Copy, Check, Sparkles, AlertCircle, Gem, Sun, Moon } from 'lucide-react';
```

| Icon | Usage |
|------|-------|
| `Sparkles` | Primary action / JSON formatting |
| `Gem` | Ruby-related actions |
| `Copy` | Copy button (default state) |
| `Check` | Copy button (success state) |
| `AlertCircle` | Error messages |
| `Sun` | Theme toggle (shown in dark mode) |
| `Moon` | Theme toggle (shown in light mode) |

Standard size: `size={18}` for buttons, `size={20}` for theme toggle, `size={28}` for header

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.x",
    "lucide-react": "^0.263.1"
  }
}
```

External (loaded via CDN):
- Prism.js 1.29.0 (core + language components)
