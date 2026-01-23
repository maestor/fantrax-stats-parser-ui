# Development Guide

## Prerequisites

1. **Node.js**: Version 24.x
2. **npm**: Comes with Node.js
3. **Backend**: [node-fantrax-stats-parser](https://github.com/maestor/node-fantrax-stats-parser) running

## Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd fantrax-stats-parser-ui

# Install dependencies
npm install
```

## Development Commands

### Start Development Server
```bash
npm start
# or
npm run start
```
- Runs on http://localhost:4200
- Auto-reloads on file changes
- Opens browser automatically

### Build for Production
```bash
npm run build
```
- Outputs to `dist/` directory
- Optimized and minified
- Ready for deployment

### Watch Mode (Development Build)
```bash
npm run watch
```
- Builds in development mode
- Watches for file changes
- Rebuilds automatically

### Run Unit Tests
```bash
npm test
```
- Runs Jasmine/Karma tests
- Opens browser with test results
- Re-runs on file changes

### Run E2E Tests
```bash
npx playwright test
```
- Runs Playwright E2E tests
- Headless by default
- Results in `test-results/`

### Angular CLI Commands
```bash
# Generate new component
npx ng generate component component-name

# Generate new service
npx ng generate service service-name

# Generate other artifacts
npx ng generate <schematic> <name>

# Help
npx ng help
```

## Project Configuration

### Backend API Endpoint
The API endpoint is configured in the service layer. Check:
- `src/app/services/api.service.ts`

### Build Configuration
- **Development**: `angular.json` → `projects.architect.build.configurations.development`
- **Production**: `angular.json` → `projects.architect.build.configurations.production`

### TypeScript Configuration
- **App**: `tsconfig.app.json`
- **Tests**: `tsconfig.spec.json`
- **Base**: `tsconfig.json`

## Development Workflow

### Adding a New Feature

1. **Plan the feature**
   - Identify affected components/services
   - Consider data flow
   - Check for reusable components

2. **Create/modify components**
   ```bash
   npx ng generate component feature-name
   ```

3. **Update services if needed**
   - Add API calls to `api.service.ts`
   - Add business logic to `stats.service.ts`
   - Update cache/filter services as needed

4. **Add translations**
   - Update translation files for new UI text

5. **Write tests**
   - Unit tests for components/services
   - Update E2E tests if needed

6. **Test locally**
   ```bash
   npm start
   npm test
   ```

7. **Verify before pushing**
   
   Run the same checks CI runs:
   ```bash
   npm run verify
   ```

   This ensures headless unit tests and the production build pass.

### Fixing a Bug

1. **Reproduce the issue**
   - Check browser console
   - Review network requests
   - Check component state

2. **Identify the cause**
   - Use Angular DevTools
   - Add console logs
   - Check RxJS observable chains

3. **Write a test** (if missing)
   - Add test case that fails
   - Fix the bug
   - Verify test passes

4. **Test the fix**
   - Manual testing
   - Run unit tests
   - Run E2E tests

### Code Review Checklist

- [ ] Code follows Angular style guide
- [ ] No console.log statements in production code
- [ ] Unit tests updated/added
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Components properly typed
- [ ] RxJS subscriptions properly cleaned up
- [ ] Material components used correctly
- [ ] Responsive design maintained
- [ ] Accessibility verified (keyboard, focus, labels; no focus in collapsed content)

## Debugging Tips

### Common Issues

1. **API not responding**
   - Ensure backend is running
   - Check network tab
   - Verify API endpoint URL

2. **Component not updating**
   - Check change detection
   - Verify observable subscriptions
   - Use async pipe when possible

3. **TypeScript errors**
   - Run `npm run build` to see all errors
   - Check type definitions
   - Verify imports

4. **Test failures**
   - Check test setup/teardown
   - Verify mock data
   - Check async test handling

### Browser DevTools

- **Angular DevTools**: Chrome/Edge extension for Angular debugging
- **Console**: Check for runtime errors
- **Network**: Monitor API calls
- **Sources**: Set breakpoints

### VSCode Debugging

Configuration in `.vscode/launch.json`:
- Attach to Chrome
- Debug unit tests
- Debug E2E tests

## Performance Optimization

### During Development

- Use Angular DevTools Profiler
- Monitor bundle size: `npm run build -- --stats-json`
- Check for memory leaks (unsubscribed observables)
- Optimize change detection

### Build Optimization

- Production builds automatically optimize
- Use `--optimization` flag for custom builds
- Analyze bundle: `webpack-bundle-analyzer`

## Git Workflow

1. Create feature branch
2. Make changes
3. Commit with descriptive messages
4. Push and create PR
5. Address review comments
6. Merge when approved

## Helpful Resources

- [Angular Documentation](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [RxJS Documentation](https://rxjs.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
