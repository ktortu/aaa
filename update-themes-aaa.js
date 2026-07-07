const fs = require('fs');
const path = require('path');

const themesDir = path.join(__dirname, 'projects/ktortu/aaa/themes');

const updates = {
  'theme-bootstrap.css': {
    old: `  --kt-surface: light-dark(#ffffff, #212529);
  --kt-on-surface: light-dark(#212529, #f8f9fa);
  --kt-muted: light-dark(#6c757d, #adb5bd);
  --kt-outline: light-dark(#dee2e6, #495057);
  --kt-outline-strong: light-dark(#adb5bd, #6c757d);
  --kt-primary: light-dark(#0d6efd, #0d6efd); 
  --kt-danger: light-dark(#dc3545, #dc3545);`,
    new: `  --kt-surface: light-dark(#ffffff, #212529);
  --kt-on-surface: light-dark(#212529, #dee2e6);
  --kt-muted: light-dark(#495057, #adb5bd);
  --kt-outline: light-dark(#dee2e6, #495057);
  --kt-outline-strong: light-dark(#adb5bd, #6c757d);
  --kt-primary: light-dark(#063a8a, #3b8bff);
  --kt-danger: light-dark(#921925, #ea6c78);`
  },
  'theme-primer.css': {
    old: `  --kt-surface: light-dark(#ffffff, #0d1117);
  --kt-on-surface: light-dark(#24292f, #c9d1d9);
  --kt-muted: light-dark(#57606a, #8b949e);
  --kt-outline: light-dark(#d0d7de, #30363d);
  --kt-outline-strong: light-dark(#8c959f, #6e7681);
  --kt-primary: light-dark(#2da44e, #238636);
  --kt-danger: light-dark(#cf222e, #da3633);`,
    new: `  --kt-surface: light-dark(#ffffff, #0d1117);
  --kt-on-surface: light-dark(#24292f, #c9d1d9);
  --kt-muted: light-dark(#424a53, #8b949e);
  --kt-outline: light-dark(#d0d7de, #30363d);
  --kt-outline-strong: light-dark(#8c959f, #6e7681);
  --kt-primary: light-dark(#185929, #3fb558);
  --kt-danger: light-dark(#8f141d, #ff5754);`
  },
  'theme-fluent.css': {
    old: `  --kt-surface: light-dark(#ffffff, #242424);
  --kt-on-surface: light-dark(#242424, #ffffff);
  --kt-muted: light-dark(#5c5c5c, #a6a6a6);
  --kt-outline: light-dark(#e0e0e0, #3d3d3d);
  --kt-outline-strong: light-dark(#8a8a8a, #707070);
  --kt-primary: light-dark(#0078d4, #2899f5);
  --kt-danger: light-dark(#d13438, #e81123);`,
    new: `  --kt-surface: light-dark(#ffffff, #202020);
  --kt-on-surface: light-dark(#242424, #ffffff);
  --kt-muted: light-dark(#424242, #a6a6a6);
  --kt-outline: light-dark(#e0e0e0, #3d3d3d);
  --kt-outline-strong: light-dark(#8a8a8a, #707070);
  --kt-primary: light-dark(#00467d, #57b0fa);
  --kt-danger: light-dark(#8c2225, #ff4c5a);`
  },
  'theme-carbon.css': {
    old: `  --kt-surface: light-dark(#ffffff, #161616);
  --kt-on-surface: light-dark(#161616, #f4f4f4);
  --kt-muted: light-dark(#525252, #a8a8a8);
  --kt-outline: light-dark(#e0e0e0, #393939);
  --kt-outline-strong: light-dark(#8d8d8d, #6f6f6f);
  --kt-primary: light-dark(#0f62fe, #4589ff);
  --kt-danger: light-dark(#da1e28, #fa4d56);`,
    new: `  --kt-surface: light-dark(#ffffff, #161616);
  --kt-on-surface: light-dark(#161616, #f4f4f4);
  --kt-muted: light-dark(#404040, #a8a8a8);
  --kt-outline: light-dark(#e0e0e0, #393939);
  --kt-outline-strong: light-dark(#8d8d8d, #6f6f6f);
  --kt-primary: light-dark(#093894, #6ba1ff);
  --kt-danger: light-dark(#9e141c, #ff7b82);`
  },
  'theme-ant.css': {
    old: `  --kt-surface: light-dark(#ffffff, #141414);
  --kt-on-surface: light-dark(rgba(0, 0, 0, 0.88), rgba(255, 255, 255, 0.85));
  --kt-muted: light-dark(rgba(0, 0, 0, 0.45), rgba(255, 255, 255, 0.45));
  --kt-outline: light-dark(#d9d9d9, #424242);
  --kt-outline-strong: light-dark(#bfbfbf, #595959);
  --kt-primary: light-dark(#1677ff, #177ddc);
  --kt-danger: light-dark(#ff4d4f, #a61d24);`,
    new: `  --kt-surface: light-dark(#ffffff, #000000);
  --kt-on-surface: light-dark(#000000, #ffffff);
  --kt-muted: light-dark(#595959, #a6a6a6);
  --kt-outline: light-dark(#d9d9d9, #424242);
  --kt-outline-strong: light-dark(#bfbfbf, #595959);
  --kt-primary: light-dark(#0d4aa6, #368ef0);
  --kt-danger: light-dark(#b32d2f, #f56c70);`
  },
  'theme-material.css': {
    old: `  --kt-surface: light-dark(#fffbfe, #1c1b1f);
  --kt-on-surface: light-dark(#1c1b1f, #e6e1e5);
  --kt-muted: light-dark(#49454f, #cac4d0);
  --kt-outline: light-dark(#79747e, #938f99);
  --kt-outline-strong: light-dark(#49454f, #cac4d0);
  --kt-primary: light-dark(#6750a4, #d0bcff);
  --kt-danger: light-dark(#b3261e, #f2b8b5);`,
    new: `  --kt-surface: light-dark(#fef7ff, #141218);
  --kt-on-surface: light-dark(#1c1b1f, #e6e1e5);
  --kt-muted: light-dark(#49454f, #cac4d0);
  --kt-outline: light-dark(#79747e, #938f99);
  --kt-outline-strong: light-dark(#49454f, #cac4d0);
  --kt-primary: light-dark(#463673, #d7c4fc);
  --kt-danger: light-dark(#8c1d17, #f7c8c6);`
  }
};

for (const [file, changes] of Object.entries(updates)) {
  const filePath = path.join(themesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Normalize newlines for consistent replacement
    const oldStr = changes.old.replace(/\r\n/g, '\n');
    if (content.includes(oldStr)) {
      content = content.replace(oldStr, changes.new);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${file}`);
    } else {
      console.log(`Failed to match target block in ${file}`);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}
