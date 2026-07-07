import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const themesDir = './projects/ktortu/aaa/themes';
const stylesDir = './projects/ktortu/aaa/styles';
const cdkStylesDir = './projects/ktortu/aaa/cdk/styles';

const themes = fs.readdirSync(themesDir).filter(f => f.endsWith('.css'));

async function run() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    colorScheme: 'dark'
  });

  for (const theme of themes) {
    const themeName = theme.replace('.css', '');
    const themeAttr = themeName.replace('theme-', '');
    
    const html = `
    <!DOCTYPE html>
    <html data-theme="${themeAttr}">
    <head>
      <style>
        ${fs.readFileSync(path.join(cdkStylesDir, 'foundation.css'), 'utf8')}
        ${fs.readFileSync(path.join(themesDir, theme), 'utf8')}
        
        body {
          background-color: var(--kt-surface, #fff);
          color: var(--kt-on-surface, #000);
          padding: 2rem;
          font-family: sans-serif;
        }
        .card {
          background-color: var(--card-bg, #eee);
          padding: 1rem;
          border-radius: var(--card-radius, 8px);
          box-shadow: var(--card-shadow, none);
          margin-bottom: 1rem;
        }
        .primary {
          color: var(--kt-primary, blue);
        }
      </style>
    </head>
    <body>
      <h1>Theme: ${themeName}</h1>
      <div class="card">
        <h2 class="primary">Primary Color</h2>
        <p>This is a surface with muted text <span style="color: var(--kt-muted)">like this</span>.</p>
      </div>
    </body>
    </html>
    `;

    await page.setContent(html);
    await page.screenshot({ path: `/home/ktortu/.gemini/antigravity-cli/brain/f369ecae-c910-4865-9210-209e3552cf04/${themeName}-dark.png` });
  }

  await browser.close();
  console.log('Screenshots generated in artifacts directory!');
}

run().catch(console.error);
