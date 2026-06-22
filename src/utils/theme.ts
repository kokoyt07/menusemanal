export function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark')
}

export function applyDarkMode(enabled: boolean): void {
  document.documentElement.classList.toggle('dark', enabled)
  localStorage.setItem('tucocinapp_darkmode', enabled ? '1' : '0')
}

export function initTheme(): void {
  if (localStorage.getItem('tucocinapp_darkmode') === '1') {
    document.documentElement.classList.add('dark')
  }
}
