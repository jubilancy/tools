async function loadLayout() {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
        try {
            const resp = await fetch('header.html');
            placeholder.innerHTML = await resp.text();
            setupTheme();
        } catch (err) {
            console.error("Layout failed:", err);
        }
    }
}

function setupTheme() {
    const html = document.documentElement;
    const toggle = document.getElementById('theme-toggle');
    
    // Set initial state
    const saved = localStorage.getItem('theme');
    const current = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    
    html.setAttribute('data-theme', current);
    if (toggle) toggle.innerText = current === 'dark' ? '[light]' : '[dark]';

    if (toggle) {
        toggle.onclick = () => {
            const now = html.getAttribute('data-theme');
            const next = now === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            toggle.innerText = next === 'dark' ? '[light]' : '[dark]';
        };
    }
}

document.addEventListener('DOMContentLoaded', loadLayout);