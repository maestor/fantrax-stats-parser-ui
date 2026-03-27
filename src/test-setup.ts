import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';
import { registerLocaleData } from '@angular/common';
import localeFi from '@angular/common/locales/fi';

registerLocaleData(localeFi);

// Polyfill ResizeObserver for jsdom (used by Chart.js when canvas context is available)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}

// Suppress noisy console.error from jsdom/canvas limitations during tests.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Failed to create chart') ||
    msg.includes('Not implemented: HTMLCanvasElement')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};
