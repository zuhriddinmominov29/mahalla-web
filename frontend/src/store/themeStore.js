import { create } from 'zustand';

function applyTheme(theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.setAttribute('data-theme', 'dark');
  } else {
    html.classList.remove('dark');
    html.setAttribute('data-theme', 'light');
  }
}

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('mb_theme') || 'dark',

  toggleTheme: () =>
    set(state => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mb_theme', next);
      applyTheme(next);
      return { theme: next };
    }),

  initTheme: () => {
    const saved = localStorage.getItem('mb_theme') || 'dark';
    applyTheme(saved);
    return saved;
  },
}));

export default useThemeStore;
