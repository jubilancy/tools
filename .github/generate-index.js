const fs = require('fs');
const path = require('path');

// Categories based on file patterns
const categories = {
  'Data & Text': ['batch-isbn', 'book-list', 'clean-text', 'csv', 'diff-viewer', 'full-text', 'json5', 'link-splitter', 'metadata', 'password', 'regex', 'strip', 'toc', 'url-categorizer', 'url-cleaner', 'yaml'],
  'URLs & Feeds': ['bulk-hyperlink', 'bulk-rss', 'bulk-url', 'feed', 'opml', 'rss', 'sitemap'],
  'Writing & Markdown': ['ascii-art', 'code-cleaner', 'code-editor', 'code-formatter', 'html-template', 'markdown', 'paste', 'turndown', 'widget', 'claude-markdown', 'convert', 'jinja'],
  'Visualization & Diagrams': ['color-palette', 'data-charts', 'diagram', 'hex-visualizer', 'sketchy'],
  'Image Tools': ['ascii-art-converter', 'bulk', 'chromatic', 'dithering', 'halftone', 'image', 'mosaic', 'pixel', 'sprite', 'steganography'],
  'Files & Media': ['barcode', 'ocr', 'qr', 'zip'],
  'Interactive & Utility': ['animation', 'canvas', 'confetti', 'css-units', 'dates', 'drag', 'emoji', 'hash', 'maps', 'math', 'offline', 'reactive', 'unit-converter'],
  'Site pages': ['changelog', 'credits', 'extra', 'guestbook', 'test']
};

// Get all HTML files in root directory
const getHtmlFiles = () => {
  const files = fs.readdirSync('.');
  return files.filter(file => file.endsWith('.html') && file !== 'index.html').sort();
};

// Categorize a file
const categorizeFile = (filename) => {
  const lower = filename.toLowerCase();
  for (const [category, patterns] of Object.entries(categories)) {
    if (patterns.some(pattern => lower.includes(pattern))) {
      return category;
    }
  }
  return 'More'; // Default category
};

// Convert filename to display name
const filenameToTitle = (filename) => {
  return filename
    .replace('.html', '')
    .replace(/-/g, ' ')
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Generate the index.html
const generateIndex = () => {
  const files = getHtmlFiles();
  
  // Group files by category
  const grouped = {};
  files.forEach(file => {
    const category = categorizeFile(file);
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(file);
  });

  // Build the links HTML
  let linksHtml = '';
  const categoryOrder = ['📊 Data & Text', '🔗 URLs & Feeds', '📝 Writing & Markdown', '📈 Visualization & Diagrams', '🖼️ Image Tools', '📦 Files & Media', '⚡ Interactive & Utility', '📁 Site pages'];

  categoryOrder.forEach(displayCategory => {
    const baseCategory = displayCategory.split(' ').slice(1).join(' ');
    if (grouped[baseCategory]) {
      linksHtml += `        <span class="section-title">${displayCategory}</span>\n`;
      linksHtml += '        <div class="tool-grid">\n';
      grouped[baseCategory].forEach(file => {
        const title = filenameToTitle(file);
        linksHtml += `            <a href="${file}">${title}</a>\n`;
      });
      linksHtml += '        </div>\n\n';
    }
  });

  // Add uncategorized files if any
  if (grouped['More']) {
    linksHtml += '        <span class="section-title">more!</span>\n';
    linksHtml += '        <div class="tool-grid">\n';
    grouped['More'].forEach(file => {
      const title = filenameToTitle(file);
      linksHtml += `            <a href="${file}">${title}</a>\n`;
    });
    linksHtml += '        </div>\n';
  }

  // Full HTML template
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>toolbox | tools.eliana.lol</title>
    <link rel="stylesheet" href="global.css">
    <link rel="icon" type="image/x-icon" href="favicon.svg">
    <style>
        .tool-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 8px;
            margin-top: 1rem;
        }
        .tool-grid a {
            border: 1px solid var(--puny);
            padding: 8px 10px;
            font-size: 0.85rem;
            border-bottom: 1px solid var(--puny);
            display: block;
        }
        .tool-grid a:hover {
            border-color: var(--text);
            background: var(--hover);
        }
        .section-title {
            margin-top: 2rem;
        }
    </style>
</head>
<body>
    <nav>
        <div class="left">
            <a href="index.html">home</a> |
            <a href="extra.html">extra</a> |
            <a href="credits.html">credits</a> |
            <a href="changelog.html">logs</a>
        </div>
        <div class="right">
            <button id="theme-toggle">[theme]</button> |
            <a href="https://eliana.lol">site</a>
        </div>
    </nav>

    <main>
        <h1>Toolbox</h1>
        <p class="puny">A collection of single-purpose utilities for the small web.</p>

        <div class="changelog-marquee">
            <strong>DIRECTORY:</strong> All tools and assets currently hosted at tools.eliana.lol.
        </div>

${linksHtml}
    </main>

    <footer style="margin-top: 4rem; text-align: center;" class="puny">
        © 2026 eliana.lol • built with intent
    </footer>

    <script>
        const html = document.documentElement;
        const toggle = document.getElementById('theme-toggle');
        const saved = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        html.setAttribute('data-theme', saved);
        if (toggle) toggle.innerText = saved === 'dark' ? '[light]' : '[dark]';
        if (toggle) {
            toggle.onclick = () => {
                const now = html.getAttribute('data-theme');
                const next = now === 'dark' ? 'light' : 'dark';
                html.setAttribute('data-theme', next);
                localStorage.setItem('theme', next);
                toggle.innerText = next === 'dark' ? '[light]' : '[dark]';
            };
        }
    </script>
</body>
</html>`;

  fs.writeFileSync('index.html', html);
  console.log('✅ index.html generated successfully!');
};

generateIndex();
