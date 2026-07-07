const fs = require('fs');

function updateTheme(name, subs) {
  const path = `projects/ktortu/aaa/themes/theme-${name}.css`;
  let css = fs.readFileSync(path, 'utf8');
  // Enlever color-scheme: dark; ou light; s'il y en a et remplacer par light dark; si on veut, mais foundation gère déjà !
  // En fait, on peut juste le virer de ces thèmes spécifiques, ou le remplacer.
  css = css.replace(/color-scheme:\s*(dark|light);/g, '/* color-scheme handled by foundation */');
  
  for (const [k, v] of Object.entries(subs)) {
    css = css.replace(new RegExp(`--${k}: [^;]+;`, 'g'), `--${k}: ${v};`);
  }
  fs.writeFileSync(path, css);
}

// 1. Catppuccin: Latte (light) / Mocha (dark)
updateTheme('catppuccin', {
  'kt-surface': 'light-dark(#eff1f5, #1e1e2e)', // Latte / Mocha base
  'kt-on-surface': 'light-dark(#4c4f69, #cdd6f4)', // text
  'kt-muted': 'light-dark(#6c6f85, #a6adc8)', // subtext0
  'kt-outline': 'light-dark(#bcc0cc, #6c7086)', // overlay0
  'kt-outline-strong': 'light-dark(#9ca0b0, #9399b2)', // overlay2
  'kt-primary': 'light-dark(#8839ef, #cba6f7)', // mauve
  'kt-danger': 'light-dark(#d20f39, #f38ba8)', // red
  'kt-neutral': 'light-dark(#ccd0da, #585b70)', // surface2
  'kt-focus-ring-color': 'light-dark(#8839ef, #cba6f7)',
  'field-bg': 'light-dark(#e6e9ef, #313244)', // surface0
  'btn-on-primary': 'light-dark(#eff1f5, #11111b)',
  'btn-on-danger': 'light-dark(#eff1f5, #11111b)',
  'btn-on-neutral': 'light-dark(#4c4f69, #ffffff)',
  'btn-on-primary-container': 'light-dark(#372061, #e2d5fb)',
  'btn-on-neutral-container': 'light-dark(#4c4f69, #cdd6f4)',
  'btn-on-danger-container': 'light-dark(#611322, #f8c8d4)',
  'btn-neutral-fg': 'light-dark(#5c5f77, #bac2de)',
  'field-caret-color': 'light-dark(#dc8a78, #f5e0dc)', // rosewater
  'kt-selection-bg': 'light-dark(#ccd0da, #585b70)',
  'kt-selection-fg': 'light-dark(#4c4f69, #cdd6f4)',
  'select-popup-bg': 'light-dark(#e6e9ef, #313244)',
  'tooltip-bg': 'light-dark(#ccd0da, #313244)',
  'tooltip-fg': 'light-dark(#4c4f69, #cdd6f4)',
  'dialog-bg': 'light-dark(#eff1f5, #181825)',
  'card-bg': 'light-dark(#e6e9ef, #313244)',
  'card-filled-bg': 'light-dark(#ccd0da, #45475a)'
});

// 2. Architecte: White paper (light) / Blueprint (dark)
updateTheme('architecte', {
  'kt-surface': 'light-dark(#fdfdfd, #16344f)', // papier / blueprint
  'kt-on-surface': 'light-dark(#16344f, #e8f1f8)',
  'kt-muted': 'light-dark(#4b6b85, #9dbdd4)',
  'kt-outline': 'light-dark(#a8cce4, #6f9dbd)',
  'kt-outline-strong': 'light-dark(#6f9dbd, #a8cce4)',
  'kt-primary': 'light-dark(#1c7fb3, #7fc8f0)', // encre bleue
  'kt-danger': 'light-dark(#b34d3b, #f0907c)', // sanguine
  'kt-neutral': 'light-dark(#d5e5f0, #3e5c75)',
  'kt-focus-ring-color': 'light-dark(#1c7fb3, #7fc8f0)',
  'field-bg': 'light-dark(#f2f8fc, #1b3c5a)',
  'btn-on-primary': 'light-dark(#ffffff, #0d2438)',
  'btn-on-danger': 'light-dark(#ffffff, #381208)',
  'btn-on-neutral': 'light-dark(#16344f, #ffffff)',
  'btn-on-primary-container': 'light-dark(#09324a, #c9e6f8)',
  'btn-on-neutral-container': 'light-dark(#16344f, #d4e2ee)',
  'btn-on-danger-container': 'light-dark(#4a150c, #f8cfc4)',
  'btn-neutral-fg': 'light-dark(#3a5b78, #a9c4da)',
  'field-caret-color': 'light-dark(#1c7fb3, #7fc8f0)',
  'kt-selection-bg': 'light-dark(#b3def5, #7fc8f0)',
  'kt-selection-fg': 'light-dark(#0d2438, #0d2438)',
  'select-popup-bg': 'light-dark(#f2f8fc, #1b3c5a)',
  'tooltip-bg': 'light-dark(#e1edf5, #0f2438)',
  'tooltip-fg': 'light-dark(#16344f, #dceaf5)',
  'dialog-border-color': 'light-dark(#a8cce4, #6f9dbd)',
  'card-bg': 'light-dark(#fdfdfd, #1b3c5a)',
  'card-filled-bg': 'light-dark(#f2f8fc, #214a6e)',
  'card-border-color': 'light-dark(#a8cce4, #6f9dbd)'
});

// 3. Cyberpunk: Day (light) / Night (dark)
updateTheme('cyberpunk', {
  'kt-surface': 'light-dark(#f0f8ff, #0b0f1a)',
  'kt-on-surface': 'light-dark(#04141a, #e6f6ff)',
  'kt-muted': 'light-dark(#5a7a91, #94b2c8)',
  'kt-outline': 'light-dark(#9ec3d9, #2f5a73)',
  'kt-outline-strong': 'light-dark(#5fb6da, #5fb6da)',
  'kt-primary': 'light-dark(#008ba3, #28d6ef)',
  'kt-danger': 'light-dark(#c20055, #ff3d8b)',
  'kt-neutral': 'light-dark(#c9e2f2, #2b3950)',
  'kt-focus-ring-color': 'light-dark(#008ba3, #28d6ef)',
  'field-caret-color': 'light-dark(#008ba3, #28d6ef)',
  'kt-selection-bg': 'light-dark(#008ba3, #28d6ef)',
  'kt-selection-fg': 'light-dark(#ffffff, #04141a)',
  'field-bg': 'light-dark(#e0f2fe, #10182a)',
  'btn-on-primary': 'light-dark(#ffffff, #04141a)',
  'btn-on-danger': 'light-dark(#ffffff, #2a0312)',
  'btn-on-neutral': 'light-dark(#04141a, #ffffff)',
  'btn-on-primary-container': 'light-dark(#003a45, #b6f4ff)',
  'btn-on-neutral-container': 'light-dark(#04141a, #d4e2ee)',
  'btn-on-danger-container': 'light-dark(#4a001a, #ffd0e2)',
  'btn-neutral-fg': 'light-dark(#3b5b70, #a9c4da)',
  'select-popup-bg': 'light-dark(#e0f2fe, #10182a)',
  'tooltip-bg': 'light-dark(#cce8fa, #10182a)',
  'tooltip-fg': 'light-dark(#04141a, #e6f6ff)',
  'dialog-bg': 'light-dark(#e0f2fe, #10182a)',
  'card-bg': 'light-dark(#ffffff, #10182a)',
  'card-filled-bg': 'light-dark(#e0f2fe, #16203a)',
  'kt-progress-bar-track-color': 'light-dark(#cce8fa, #10182a)'
});

// 4. Aurora: Light / Dark (deep purple)
updateTheme('aurora', {
  'kt-primary': 'light-dark(#4f46e5, #818cf8)',
  'kt-danger': 'light-dark(#be185d, #f472b6)',
  'kt-neutral': 'light-dark(#475569, #94a3b8)',
  'kt-surface': 'light-dark(#f7f9fc, #0f172a)',
  'kt-on-surface': 'light-dark(#16203a, #f8fafc)',
  'kt-muted': 'light-dark(#4a5878, #cbd5e1)',
  'kt-outline': 'light-dark(#cdd6e8, #334155)',
  'kt-outline-strong': 'light-dark(#8493b3, #64748b)',
  'kt-focus-ring-color': 'light-dark(#4f46e5, #818cf8)',
  'field-caret-color': 'light-dark(#4f46e5, #818cf8)',
  'kt-selection-bg': 'light-dark(#ddd6fe, #4c1d95)',
  'kt-selection-fg': 'light-dark(#2e1065, #ede9fe)',
  'field-bg': 'light-dark(#ffffff, #1e293b)',
  'btn-on-primary-container': 'light-dark(#2e1065, #c7d2fe)',
  'btn-on-danger-container': 'light-dark(#6b0f3a, #fbcfe8)',
  'btn-on-neutral-container': 'light-dark(#16203a, #f1f5f9)',
  'select-popup-bg': 'light-dark(#ffffff, #1e293b)',
  'tooltip-bg': 'light-dark(#16203a, #f1f5f9)',
  'tooltip-fg': 'light-dark(#f7f9fc, #0f172a)',
  'dialog-bg': 'light-dark(#ffffff, #1e293b)',
  'card-bg': 'light-dark(#ffffff, #1e293b)',
  'card-filled-bg': 'light-dark(#f1f0fe, #272740)'
});

// 5. Vegetal: Light / Dark (deep forest)
updateTheme('vegetal', {
  'kt-primary': 'light-dark(#36743f, #84c48f)',
  'kt-danger': 'light-dark(#b04a2e, #e8866d)',
  'kt-neutral': 'light-dark(#6b5d4a, #b0a390)',
  'kt-surface': 'light-dark(#f5f3e8, #182116)',
  'kt-on-surface': 'light-dark(#2a3326, #e7e3d2)',
  'kt-muted': 'light-dark(#5b6a51, #9aa88f)',
  'kt-outline': 'light-dark(#7d8a69, #3f4d38)',
  'kt-outline-strong': 'light-dark(#5b6a51, #7d8a69)',
  'kt-focus-ring-color': 'light-dark(#36743f, #84c48f)',
  'field-bg': 'light-dark(#fdfcf5, #222b1e)',
  'field-caret-color': 'light-dark(#36743f, #84c48f)',
  'kt-selection-bg': 'light-dark(#36743f, #36743f)',
  'kt-selection-fg': 'light-dark(#ffffff, #ffffff)',
  'btn-on-primary-container': 'light-dark(#1f4a28, #b6eac1)',
  'btn-on-danger-container': 'light-dark(#6e2a18, #fcd0c5)',
  'btn-on-neutral-container': 'light-dark(#3a3328, #e0d5c3)',
  'select-popup-bg': 'light-dark(#fdfcf5, #222b1e)',
  'tooltip-bg': 'light-dark(#33402c, #e7e3d2)',
  'tooltip-fg': 'light-dark(#eef2e4, #182116)',
  'card-bg': 'light-dark(#fdfcf5, #222b1e)',
  'card-filled-bg': 'light-dark(#eef0e2, #2c3826)'
});

console.log('Experimental themes updated!');
