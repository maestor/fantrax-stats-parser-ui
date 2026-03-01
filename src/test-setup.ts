import '@testing-library/jest-dom/vitest';
import 'vitest-canvas-mock';

// Polyfill ResizeObserver for jsdom (used by Chart.js when canvas context is available)
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof globalThis.ResizeObserver;
}

// Prevent Vitest from flagging expected API errors as "unhandled exceptions".
// RxJS throwError() inside catchError → shareReplay can surface synchronously before
// the subscriber's error handler runs. The errors ARE tested — this just stops
// Vitest from treating them as uncaught.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const proc = (globalThis as any)['process'];
if (proc && !proc.__apiErrorHandlerInstalled) {
  proc.__apiErrorHandlerInstalled = true;
  proc.on('uncaughtException', (err: Error) => {
    if (err?.message === 'Something went wrong with the API!') return;
    throw err;
  });
}

// Suppress expected console.error output during tests (e.g. API error handling tests).
// The errors are still tested — we just don't want them polluting the test output.
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Failed to create chart') ||
    msg.includes('Not implemented: HTMLCanvasElement') ||
    msg.includes('API Error:')
  ) {
    return;
  }
  originalConsoleError.call(console, ...args);
};
