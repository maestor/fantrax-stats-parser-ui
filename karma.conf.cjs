const path = require('node:path');

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage'),
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        // for example, you can disable the random execution with `random: false`
        // or set a specific seed with `seed: 4321`
      },
      clearContext: false,
    },
    jasmineHtmlReporter: {
      suppressAll: true,
    },
    coverageReporter: {
      dir: path.join(__dirname, 'coverage', 'fantrax-stats-parser-ui'),
      subdir: '.',
      reporters: [
        { type: 'html' },
        { type: 'text-summary' },
        { type: 'json', file: 'coverage-final.json' },
      ],
      check: {
        emitWarning: false,
        global: {
          statements: 95,
          lines: 95,
          functions: 95,
          branches: 85,
          excludes: [
            '**/*.spec.ts',
            '**/*.test.ts',
            '**/*.d.ts',
            '**/test.ts',
            '**/testing/**',
            'src/main.ts',
            'src/environments/**',
            'src/app/app.config.ts',
            'src/app/app.routes.ts',
          ],
        },
      },
    },
    // 'progress' uses dynamic TTY updates which can appear as "no output" in some terminals/log collectors.
    // 'dots' is stable and works well both locally and in CI/log capture.
    reporters: ['dots', 'kjhtml'],
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--headless', '--disable-gpu', '--disable-dev-shm-usage'],
      },
    },
    restartOnFileChange: true,
  });
};
