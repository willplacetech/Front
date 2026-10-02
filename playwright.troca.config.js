import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  testMatch: 'troca.spec.js',
  fullyParallel: true,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:5175' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } }
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5175 --strictPort', url: 'http://127.0.0.1:5175', reuseExistingServer: false }
});
