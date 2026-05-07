// Theme Engine
const ThemeEngine = {
  current: 'dark',
  init() {
    const saved = localStorage.getItem('theme_pref') || 'system';
    this.set(saved, false);
  },
  set(mode, save = true) {
    if (mode === 'system') {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.apply(dark ? 'dark' : 'light');
    } else {
      this.apply(mode);
    }
    if (save) localStorage.setItem('theme_pref', mode);
    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === mode);
    });
  },
  apply(theme) {
    this.current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    document.body.classList.toggle('dark-mode', theme === 'dark');
    document.body.classList.toggle('light-mode', theme === 'light');
  },
  toggle() {
    this.set(this.current === 'dark' ? 'light' : 'dark');
  }
};

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (localStorage.getItem('theme_pref') === 'system') ThemeEngine.set('system', false);
});
