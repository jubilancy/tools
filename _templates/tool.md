---
title: My Tool
description: One sentence shown under the title and in search results.
category: Data & Text   # must match a name in _data/categories.yml
---

<style>
  /* tool-specific CSS; global.css and the theme variables (--bg, --text, --accent, --puny) are already loaded */
</style>

<textarea id="input" rows="8" placeholder="Paste here"></textarea>
<button id="run">Run</button>
<pre id="output"></pre>

<script>
  document.getElementById('run').onclick = () => {
    document.getElementById('output').textContent = document.getElementById('input').value;
  };
</script>
