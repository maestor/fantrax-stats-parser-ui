import {
  buildPageTitle,
  buildSeoTranslationKeys,
  normalizeSeoPath,
  resolveActiveRouteSeo,
  RouteSeoData,
} from './seo.utils';

type FakeRouteSnapshot = {
  data?: Readonly<Record<string, unknown>>;
  firstChild?: FakeRouteSnapshot | null;
};

function createRouteSnapshot(
  seo?: RouteSeoData,
  firstChild?: FakeRouteSnapshot | null,
): FakeRouteSnapshot {
  return {
    data: seo ? { seo } : undefined,
    firstChild: firstChild ?? null,
  };
}

describe('seo.utils', () => {
  it('returns the plain site title for the front page and appends section/tab elsewhere', () => {
    expect(buildPageTitle('SITE')).toBe('SITE');
    expect(buildPageTitle('SITE', 'SECTION', 'TAB')).toBe('SITE | SECTION | TAB');
  });

  it('collects the translation keys needed for the active route metadata', () => {
    expect(buildSeoTranslationKeys({})).toEqual(['pageTitle', 'seo.description']);
    expect(
      buildSeoTranslationKeys({
        sectionKey: 'nav.leaderboards',
        tabKey: 'leaderboards.tabs.playoffs',
      }),
    ).toEqual([
      'pageTitle',
      'seo.description',
      'nav.leaderboards',
      'leaderboards.tabs.playoffs',
    ]);
  });

  it('normalizes router urls by stripping query and hash fragments', () => {
    expect(normalizeSeoPath('/career/goalies?sort=name#table')).toBe('/career/goalies');
    expect(normalizeSeoPath('')).toBe('/');
  });

  it('merges parent and child SEO route data from the active route tree', () => {
    const snapshot = createRouteSnapshot(
      { sectionKey: 'nav.playerCareers' },
      createRouteSnapshot({ tabKey: 'career.tabs.highlights' }),
    );

    expect(resolveActiveRouteSeo(snapshot)).toEqual({
      sectionKey: 'nav.playerCareers',
      tabKey: 'career.tabs.highlights',
    });
  });
});
