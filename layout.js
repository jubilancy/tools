async function loadLayout() {
    const placeholder = document.getElementById('nav-placeholder');
    if (placeholder) {
        try {
            const resp = await fetch('header.html');
            placeholder.innerHTML = await resp.text();
            initTheme(); // Initialize theme after header is loaded
        } catch (err) {
            console.error("Layout failed:", err);
        }
    }
}

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const html = document.documentElement;

    // 1. Check for saved preference, otherwise use system
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        html.setAttribute('data-theme', savedTheme);
        updateToggleText(toggle, savedTheme);
    }

    if (toggle) {
        toggle.addEventListener('click', () => {
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateToggleText(toggle, newTheme);
        });
    }
}

function updateToggleText(btn, theme) {
    if (btn) btn.innerText = theme === 'dark' ? '[light]' : '[dark]';
}

document.addEventListener('DOMContentLoaded', loadLayout);