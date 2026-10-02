import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests', testMatch: 'trocasAdmin.spec.js', workers: 2, fullyParallel: true,
  globalTimeout: 180000, globalSetup: './tests/troca.setup.js',
  use: { baseURL: 'http://127.0.0.1:5175' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'], defaultBrowserType: 'chromium' } }
  ]
});
