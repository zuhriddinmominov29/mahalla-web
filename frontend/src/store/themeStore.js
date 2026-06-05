import { create } from 'zustand';

const useThemeStore = create((set) => ({
  theme: localStorage.getItem('mb_theme') || 'dark',
  toggleTheme: () =>
    set(state => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('mb_theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
  initTheme: () => {
    const saved = localStorage.getItem('mb_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    return saved;
  },
}));

export default useThemeStore;
