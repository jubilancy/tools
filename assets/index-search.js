(function () {
    const input = document.getElementById('tool-search');
    const countEl = document.getElementById('search-count');
    const emptyEl = document.getElementById('search-empty');
    if (!input || !countEl || !emptyEl) return;

    const HIDE = 'search-hidden';

    const norm = (s) => s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const safeDecode = (s) => { try { return decodeURIComponent(s); } catch (e) { return s; } };

    // Build an index once: each category, and each tool link inside it.
    const groups = Array.from(document.querySelectorAll('main .section-title'))
        .map((title) => {
            const grid = title.nextElementSibling;
            if (!grid || !grid.classList.contains('tool-grid')) return null;
            const items = Array.from(grid.querySelectorAll('a')).map((a) => {
                const file = safeDecode(a.getAttribute('href') || '')
                    .replace(/\.html$/i, '')
                    .replace(/[-_]+/g, ' ');
                return { el: a, text: norm(a.textContent + ' ' + file) };
            });
            return { title, grid, items, label: norm(title.textContent) };
        })
        .filter(Boolean);

    const total = groups.reduce((n, g) => n + g.items.length, 0);

    function apply(raw) {
        const terms = norm(raw).split(/\s+/).filter(Boolean);
        let shown = 0;

        groups.forEach((g) => {
            let groupShown = 0;
            g.items.forEach((item) => {
                // every term must hit the tool's title/filename OR its category name
                const ok = terms.every((t) => item.text.includes(t) || g.label.includes(t));
                item.el.classList.toggle(HIDE, !ok);
                if (ok) groupShown++;
            });
            g.title.classList.toggle(HIDE, groupShown === 0);
            g.grid.classList.toggle(HIDE, groupShown === 0);
            shown += groupShown;
        });

        if (!terms.length) {
            countEl.textContent = total + ' tools \u2022 press / to search, esc to clear';
            emptyEl.classList.add(HIDE);
        } else {
            countEl.textContent = 'showing ' + shown + ' of ' + total;
            if (shown === 0) {
                emptyEl.textContent = 'no tools match \u201c' + raw.trim() + '\u201d. try fewer or shorter words.';
                emptyEl.classList.remove(HIDE);
            } else {
                emptyEl.classList.add(HIDE);
            }
        }

        // keep the query shareable / restorable via ?q=
        try {
            const url = new URL(window.location.href);
            if (raw.trim()) url.searchParams.set('q', raw.trim());
            else url.searchParams.delete('q');
            history.replaceState(null, '', url);
        } catch (e) { /* non-critical */ }
    }

    const firstVisible = () => document.querySelector('.tool-grid a:not(.' + HIDE + ')');

    input.addEventListener('input', () => apply(input.value));

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (input.value) { input.value = ''; apply(''); }
            else input.blur();
        } else if (e.key === 'Enter' && input.value.trim()) {
            const hit = firstVisible();
            if (hit) hit.click();
        } else if (e.key === 'ArrowDown') {
            const hit = input.value.trim() && firstVisible();
            if (hit) { e.preventDefault(); hit.focus(); }
        }
    });

    // "/" jumps to the search box from anywhere (unless already typing somewhere)
    document.addEventListener('keydown', (e) => {
        if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey) return;
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
        e.preventDefault();
        input.focus();
        input.select();
    });

    // restore ?q= on load
    const initial = new URLSearchParams(window.location.search).get('q');
    if (initial) input.value = initial;
    apply(input.value);
})();
