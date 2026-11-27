---
title: HTML Template Engine
description: Write a Handlebars template, provide JSON data, get rendered HTML. Download the result.
category: Writing & Markdown
---

<style>
.tool-layout { display: flex; flex-direction: column; gap: 20px; }
.action-bar { display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0; }
label { display: block; font-size: 0.7rem; text-transform: uppercase; font-weight: bold; color: var(--puny); margin-bottom: 5px; }
.three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; }
@media (max-width: 760px) { .three-col { grid-template-columns: 1fr; } }
#error { color: var(--accent); font-size: 0.8rem; min-height: 1.2rem; }
#preview-frame { border: 1px solid var(--puny); width: 100%; height: 300px; background: #fff; }
</style>

<div class="tool-layout">
  <div class="three-col">
    <div>
      <label>Handlebars template</label>
      <textarea id="tmpl" rows="16" oninput="render()"></textarea>
    </div>
    <div>
      <label>JSON data</label>
      <textarea id="data" rows="16" oninput="render()"></textarea>
    </div>
    <div>
      <label>Rendered HTML</label>
      <textarea id="output" rows="16" readonly></textarea>
    </div>
  </div>
  <div id="error"></div>
  <div>
    <label>Preview</label>
    <iframe id="preview-frame" sandbox="allow-same-origin"></iframe>
  </div>
  <div class="action-bar">
    <button onclick="loadSample()">Sample</button>
    <button onclick="copyOutput()">Copy HTML</button>
    <button onclick="downloadHTML()">Download HTML</button>
    <button onclick="clearAll()">Clear</button>
  </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/handlebars@4.7.8/dist/handlebars.min.js"></script>
<script>
function render() {
  const tmplSrc = document.getElementById('tmpl').value;
  const dataSrc = document.getElementById('data').value;
  const err = document.getElementById('error');
  try {
    const data = JSON.parse(dataSrc);
    const compiled = Handlebars.compile(tmplSrc);
    const html = compiled(data);
    document.getElementById('output').value = html;
    document.getElementById('preview-frame').srcdoc = html;
    err.textContent = '';
  } catch(e) {
    err.textContent = e.message;
  }
}

function loadSample() {
  document.getElementById('tmpl').value = `<h1>{{title}}</h1>\n<p>By {{author}}</p>\n<ul>\n{{#each items}}\n  <li><strong>{{name}}</strong> — {{desc}}</li>\n{{/each}}\n</ul>\n{{#if footer}}<footer>{{footer}}</footer>{{/if}}`;
  document.getElementById('data').value = JSON.stringify({
    title: "My Tool Collection",
    author: "eliana",
    items: [
      { name: "CSV Parser", desc: "Parse CSV to JSON" },
      { name: "Diff Viewer", desc: "Compare text changes" },
      { name: "QR Generator", desc: "Make QR codes" }
    ],
    footer: "tools.eliana.lol"
  }, null, 2);
  render();
}

function copyOutput() { navigator.clipboard.writeText(document.getElementById('output').value); }
function downloadHTML() {
  const a = document.createElement('a');
  a.href = 'data:text/html;charset=utf-8,'+encodeURIComponent(document.getElementById('output').value);
  a.download = 'rendered.html'; a.click();
}
function clearAll() { ['tmpl','data','output'].forEach(id => document.getElementById(id).value=''); document.getElementById('preview-frame').srcdoc=''; document.getElementById('error').textContent=''; }

loadSample();
</script>
