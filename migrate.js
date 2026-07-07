const fs = require('fs');

function updateMaterialYou() {
  let css = fs.readFileSync('projects/ktortu/aaa/themes/theme-material-you.css', 'utf8');
  css = css.replace(/--kt-surface: oklch\([^)]+\);/g, '--kt-surface: light-dark(oklch(from var(--myou-seed) 0.985 0.008 h), oklch(from var(--myou-seed) 0.1 0.008 h));');
  css = css.replace(/--kt-on-surface: oklch\([^)]+\);/g, '--kt-on-surface: light-dark(oklch(from var(--myou-seed) 0.22 0.02 h), oklch(from var(--myou-seed) 0.9 0.02 h));');
  css = css.replace(/--kt-muted: oklch\([^)]+\);/g, '--kt-muted: light-dark(oklch(from var(--myou-seed) 0.42 0.03 h), oklch(from var(--myou-seed) 0.7 0.03 h));');
  css = css.replace(/--kt-outline: oklch\([^)]+\);/g, '--kt-outline: light-dark(oklch(from var(--myou-seed) 0.55 0.03 h), oklch(from var(--myou-seed) 0.45 0.03 h));');
  css = css.replace(/--kt-outline-strong: oklch\([^)]+\);/g, '--kt-outline-strong: light-dark(oklch(from var(--myou-seed) 0.45 0.04 h), oklch(from var(--myou-seed) 0.65 0.04 h));');
  css = css.replace(/--kt-primary: oklch\([^)]+\);/g, '--kt-primary: light-dark(oklch(from var(--myou-seed) 0.46 0.09 h), oklch(from var(--myou-seed) 0.8 0.09 h));');
  css = css.replace(/--kt-danger: #b3261e;/g, '--kt-danger: light-dark(#b3261e, #f2b8b5);');
  css = css.replace(/--kt-neutral: oklch\([^)]+\);/g, '--kt-neutral: light-dark(oklch(from var(--myou-seed) 0.4 0.02 h), oklch(from var(--myou-seed) 0.8 0.02 h));');
  css = css.replace(/--kt-focus-ring-color: oklch\([^)]+\);/g, '--kt-focus-ring-color: light-dark(oklch(from var(--myou-seed) 0.46 0.09 h), oklch(from var(--myou-seed) 0.8 0.09 h));');
  css = css.replace(/--field-bg: oklch\([^)]+\);/g, '--field-bg: light-dark(oklch(from var(--myou-seed) 0.94 0.02 h), oklch(from var(--myou-seed) 0.15 0.02 h));');
  css = css.replace(/--field-focus-ring: color-mix\([^)]+\);/g, '--field-focus-ring: light-dark(color-mix(in srgb, oklch(from var(--myou-seed) 0.46 0.09 h) 55%, transparent), color-mix(in srgb, oklch(from var(--myou-seed) 0.8 0.09 h) 55%, transparent));');
  css = css.replace(/--btn-on-primary-container: oklch\([^)]+\);/g, '--btn-on-primary-container: light-dark(oklch(from var(--myou-seed) 0.25 0.06 h), oklch(from var(--myou-seed) 0.9 0.06 h));');
  css = css.replace(/--btn-on-neutral-container: oklch\([^)]+\);/g, '--btn-on-neutral-container: light-dark(oklch(from var(--myou-seed) 0.25 0.02 h), oklch(from var(--myou-seed) 0.9 0.02 h));');
  css = css.replace(/--field-caret-color: oklch\([^)]+\);/g, '--field-caret-color: light-dark(oklch(from var(--myou-seed) 0.46 0.09 h), oklch(from var(--myou-seed) 0.8 0.09 h));');
  css = css.replace(/--kt-selection-bg: oklch\([^)]+\);/g, '--kt-selection-bg: light-dark(oklch(from var(--myou-seed) 0.88 0.05 h), oklch(from var(--myou-seed) 0.3 0.05 h));');
  css = css.replace(/--kt-selection-fg: oklch\([^)]+\);/g, '--kt-selection-fg: light-dark(oklch(from var(--myou-seed) 0.25 0.05 h), oklch(from var(--myou-seed) 0.9 0.05 h));');
  css = css.replace(/--select-popup-bg: oklch\([^)]+\);/g, '--select-popup-bg: light-dark(oklch(from var(--myou-seed) 0.97 0.01 h), oklch(from var(--myou-seed) 0.12 0.01 h));');
  css = css.replace(/--select-popup-shadow: [^;]+;/g, '--select-popup-shadow: light-dark(0 4px 16px oklch(from var(--myou-seed) 0.3 0.04 h / 25%), 0 0 0 1px rgba(255, 255, 255, 0.1));');
  css = css.replace(/--kt-sheet-scrim: [^;]+;/g, '--kt-sheet-scrim: light-dark(oklch(from var(--myou-seed) 0.2 0.03 h / 50%), oklch(from var(--myou-seed) 0.1 0.03 h / 60%));');
  css = css.replace(/--kt-sheet-shadow: [^;]+;/g, '--kt-sheet-shadow: light-dark(0 -4px 16px oklch(from var(--myou-seed) 0.3 0.04 h / 22%), 0 -1px 0 rgba(255, 255, 255, 0.1));');
  css = css.replace(/--tooltip-bg: oklch\([^)]+\);/g, '--tooltip-bg: light-dark(oklch(from var(--myou-seed) 0.27 0.03 h), oklch(from var(--myou-seed) 0.9 0.03 h));');
  css = css.replace(/--tooltip-fg: oklch\([^)]+\);/g, '--tooltip-fg: light-dark(oklch(from var(--myou-seed) 0.96 0.01 h), oklch(from var(--myou-seed) 0.1 0.01 h));');
  css = css.replace(/--dialog-bg: oklch\([^)]+\);/g, '--dialog-bg: light-dark(oklch(from var(--myou-seed) 0.97 0.01 h), oklch(from var(--myou-seed) 0.15 0.01 h));');
  css = css.replace(/--card-bg: oklch\([^)]+\);/g, '--card-bg: light-dark(oklch(from var(--myou-seed) 0.97 0.01 h), oklch(from var(--myou-seed) 0.12 0.01 h));');
  css = css.replace(/--card-filled-bg: oklch\([^)]+\);/g, '--card-filled-bg: light-dark(oklch(from var(--myou-seed) 0.94 0.02 h), oklch(from var(--myou-seed) 0.18 0.02 h));');
  css = css.replace(/--card-shadow: [^;]+;/g, '--card-shadow: light-dark(0 1px 3px oklch(from var(--myou-seed) 0.3 0.04 h / 20%), 0 0 0 1px rgba(255, 255, 255, 0.1));');
  css = css.replace(/--card-shadow-hover: [^;]+;/g, '--card-shadow-hover: light-dark(0 2px 8px oklch(from var(--myou-seed) 0.3 0.04 h / 26%), 0 0 0 1px rgba(255, 255, 255, 0.2));');
  fs.writeFileSync('projects/ktortu/aaa/themes/theme-material-you.css', css);
}

function updateTheme(name, subs) {
  let css = fs.readFileSync(`projects/ktortu/aaa/themes/theme-${name}.css`, 'utf8');
  for (const [k, v] of Object.entries(subs)) {
    css = css.replace(new RegExp(`--${k}: [^;]+;`, 'g'), `--${k}: ${v};`);
  }
  fs.writeFileSync(`projects/ktortu/aaa/themes/theme-${name}.css`, css);
}

updateMaterialYou();

updateTheme('primer', {
  'kt-primary': 'light-dark(#0969da, #58a6ff)',
  'kt-danger': 'light-dark(#cf222e, #ff7b72)',
  'kt-neutral': 'light-dark(#57606a, #8b949e)',
  'kt-surface': 'light-dark(#ffffff, #0d1117)',
  'kt-on-surface': 'light-dark(#1f2328, #e6edf3)',
  'kt-muted': 'light-dark(#59636e, #7d8590)',
  'kt-outline': 'light-dark(#d0d7de, #30363d)',
  'kt-outline-strong': 'light-dark(#818b98, #8b949e)',
  'kt-focus-ring-color': 'light-dark(#0969da, #58a6ff)',
  'field-shadow': 'light-dark(inset 0 1px 0 rgb(31 35 40 / 4%), inset 0 1px 0 rgb(255 255 255 / 4%))',
  'btn-shadow': 'light-dark(0 1px 0 rgb(31 35 40 / 4%), 0 1px 0 rgb(255 255 255 / 4%))',
  'select-popup-shadow': 'light-dark(0 8px 24px rgb(140 149 159 / 20%), 0 0 0 1px #30363d)',
  'tooltip-bg': 'light-dark(#25292e, #e6edf3)',
  'tooltip-fg': 'light-dark(#ffffff, #0d1117)',
  'dialog-border-color': 'light-dark(#d0d7de, #30363d)',
  'card-border-color': 'light-dark(#d0d7de, #30363d)',
  'card-filled-bg': 'light-dark(#f6f8fa, #161b22)',
  'card-shadow': 'light-dark(0 1px 0 rgb(31 35 40 / 4%), 0 1px 3px rgb(31 35 40 / 6%), 0 0 0 1px #30363d)'
});

updateTheme('fluent', {
  'kt-primary': 'light-dark(#0f6cbd, #479ef5)',
  'kt-danger': 'light-dark(#c50f1f, #f1707b)',
  'kt-neutral': 'light-dark(#424242, #d1d1d1)',
  'kt-surface': 'light-dark(#fafafa, #202020)',
  'kt-on-surface': 'light-dark(#242424, #ffffff)',
  'kt-muted': 'light-dark(#616161, #a6a6a6)',
  'kt-outline': 'light-dark(#d1d1d1, #404040)',
  'kt-outline-strong': 'light-dark(#757575, #8a8a8a)',
  'field-bg': 'light-dark(#ffffff, #292929)',
  'btn-shadow': 'light-dark(0 1px 2px rgb(0 0 0 / 10%), 0 0 0 1px rgba(255, 255, 255, 0.1))',
  'btn-on-primary-container': 'light-dark(#0c4f87, #93c5fd)',
  'btn-on-danger-container': 'light-dark(#7a0c14, #fca5a5)',
  'btn-on-neutral-container': 'light-dark(#1f1f1f, #ffffff)',
  'select-popup-shadow': 'light-dark(0 8px 16px rgb(0 0 0 / 14%), 0 0 0 1px rgba(255, 255, 255, 0.1))',
  'tooltip-bg': 'light-dark(#242424, #ffffff)',
  'tooltip-fg': 'light-dark(#ffffff, #242424)',
  'card-filled-bg': 'light-dark(#f5f5f5, #292929)',
  'card-shadow': 'light-dark(0 1px 2px rgb(0 0 0 / 12%), 0 0 2px rgb(0 0 0 / 8%), 0 0 0 1px rgba(255, 255, 255, 0.1))',
  'card-shadow-hover': 'light-dark(0 4px 8px rgb(0 0 0 / 14%), 0 0 2px rgb(0 0 0 / 10%), 0 0 0 1px rgba(255, 255, 255, 0.2))'
});

updateTheme('ant', {
  'kt-primary': 'light-dark(#0958d9, #1677ff)',
  'kt-danger': 'light-dark(#cf1322, #ff4d4f)',
  'kt-neutral': 'light-dark(#434343, #d9d9d9)',
  'kt-surface': 'light-dark(#ffffff, #141414)',
  'kt-on-surface': 'light-dark(#1f1f1f, rgba(255, 255, 255, 0.85))',
  'kt-muted': 'light-dark(#595959, rgba(255, 255, 255, 0.65))',
  'kt-outline': 'light-dark(#d9d9d9, #424242)',
  'kt-outline-strong': 'light-dark(#8c8c8c, #636363)',
  'btn-on-primary-container': 'light-dark(#003eb3, #69b1ff)',
  'btn-on-danger-container': 'light-dark(#820014, #ff7875)',
  'btn-on-neutral-container': 'light-dark(#1f1f1f, rgba(255, 255, 255, 0.85))',
  'select-popup-shadow': 'light-dark(0 6px 16px rgb(0 0 0 / 8%), 0 3px 6px rgb(0 0 0 / 12%), 0 0 0 1px #424242)',
  'tooltip-bg': 'light-dark(#1f1f1f, rgba(255, 255, 255, 0.85))',
  'tooltip-fg': 'light-dark(#ffffff, #1f1f1f)',
  'card-filled-bg': 'light-dark(#fafafa, #1f1f1f)',
  'card-shadow': 'light-dark(0 1px 2px rgb(0 0 0 / 3%), 0 1px 6px -1px rgb(0 0 0 / 2%), 0 2px 4px rgb(0 0 0 / 2%), 0 0 0 1px #424242)'
});

updateTheme('bootstrap', {
  'kt-primary': 'light-dark(#0b5ed7, #0d6efd)',
  'kt-danger': 'light-dark(#bb2d3b, #dc3545)',
  'kt-neutral': 'light-dark(#6c757d, #adb5bd)',
  'kt-surface': 'light-dark(#ffffff, #212529)',
  'kt-on-surface': 'light-dark(#212529, #f8f9fa)',
  'kt-muted': 'light-dark(#6c757d, #adb5bd)',
  'kt-outline': 'light-dark(#ced4da, #495057)',
  'kt-outline-strong': 'light-dark(#adb5bd, #6c757d)',
  'field-focus-ring': 'light-dark(rgb(13 110 253 / 25%), rgb(13 110 253 / 50%))',
  'btn-on-primary-container': 'light-dark(#052c65, #9ec5fe)',
  'btn-on-danger-container': 'light-dark(#58151c, #f1aeb5)',
  'btn-on-neutral-container': 'light-dark(#212529, #f8f9fa)',
  'tooltip-bg': 'light-dark(#212529, #f8f9fa)',
  'tooltip-fg': 'light-dark(#ffffff, #212529)',
  'dialog-border-color': 'light-dark(rgb(0 0 0 / 17.5%), rgb(255 255 255 / 15%))',
  'dialog-shadow': 'light-dark(0 0.5rem 1rem rgb(0 0 0 / 15%), 0 0 0 1px rgba(255, 255, 255, 0.1))',
  'card-border-color': 'light-dark(rgb(0 0 0 / 17.5%), rgb(255 255 255 / 15%))',
  'card-filled-bg': 'light-dark(#f8f9fa, #2b3035)',
  'card-shadow': 'light-dark(0 0.125rem 0.25rem rgb(0 0 0 / 7.5%), 0 0 0 1px rgba(255, 255, 255, 0.15))'
});

updateTheme('carbon', {
  'kt-primary': 'light-dark(#0043ce, #4589ff)',
  'kt-danger': 'light-dark(#750e13, #fa4d56)',
  'kt-neutral': 'light-dark(#393939, #c6c6c6)',
  'kt-surface': 'light-dark(#ffffff, #161616)',
  'kt-on-surface': 'light-dark(#161616, #f4f4f4)',
  'kt-muted': 'light-dark(#525252, #a8a8a8)',
  'kt-outline': 'light-dark(#8d8d8d, #525252)',
  'kt-outline-strong': 'light-dark(#161616, #f4f4f4)',
  'field-bg': 'light-dark(#f4f4f4, #262626)',
  'btn-on-primary-container': 'light-dark(#002c9b, #a6c8ff)',
  'btn-on-danger-container': 'light-dark(#750e13, #ff8389)',
  'btn-on-neutral-container': 'light-dark(#161616, #f4f4f4)',
  'tooltip-bg': 'light-dark(#393939, #f4f4f4)',
  'tooltip-fg': 'light-dark(#ffffff, #161616)',
  'dialog-shadow': 'light-dark(0 2px 6px rgb(0 0 0 / 20%), 0 0 0 1px #525252)',
  'kt-sheet-shadow': 'light-dark(0 -2px 6px rgb(0 0 0 / 30%), 0 -1px 0 #525252)',
  'card-filled-bg': 'light-dark(#f4f4f4, #262626)',
  'card-shadow': 'light-dark(0 2px 6px rgb(0 0 0 / 20%), 0 0 0 1px #525252)'
});

console.log('Themes migrated to light-dark');
