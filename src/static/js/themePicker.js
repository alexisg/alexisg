// Minimal checkbox-driven theme toggle
(function () {
    var themeKey = 'theme';
    var checkbox = document.querySelector('.js-theme-toggle');
    if (!checkbox) return;

    // Initial state is set in head to avoid FOUC; just sync the checkbox
    var current = document.documentElement.getAttribute('data-theme') || 'light';
    checkbox.checked = current === 'dark';

    checkbox.addEventListener('change', function () {
        var theme = checkbox.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem(themeKey, theme); } catch (e) {}
    });
})();
