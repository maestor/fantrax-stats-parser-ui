# Roadmap

Planned improvements and future development ideas, roughly ordered by priority.

## E2E Testing

### Missing test coverage

- **Copy link button** — Test that clicking the copy-link button in the player card header copies the correct shareable URL
- **Compare toggle persistence** — Verify that the "Vertaa hyökkääjiin/puolustajiin" toggle state persists across tab switches within the player card
- **Mobile graph accordion** — Test series toggle via the "Näytettävät tilastot" accordion on mobile viewports (requires the accordion feature to be implemented in the app first)

### CI/CD integration

- Mock the backend with [MSW](https://mswjs.io/) (Mock Service Worker) so E2E tests can run in CI without a live backend
- Add E2E tests to GitHub Actions workflow
- Generate HTML test reports on failure

### Test data management

- Create fixture data files for consistent, data-dependent assertions
- Add test data builder utilities

### Advanced testing

- Visual regression testing (Playwright screenshot comparison)
- Performance testing (Core Web Vitals)

## Application features

_(Add planned app features here as they come up.)_
