import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable, Subject, of } from 'rxjs';

import { SeoService } from './seo.service';
import { RouteSeoData } from '@shared/utils/seo.utils';
import { environment } from '../../environments/environment';

const SITE_TITLE = 'SITE_TITLE';
const DEFAULT_DESCRIPTION = 'DEFAULT_DESCRIPTION';
const CAREER_SECTION = 'CAREER_SECTION';
const GOALIES_TAB = 'GOALIES_TAB';
const DRAFT_SECTION = 'DRAFT_SECTION';
const OPENING_DRAFT_TAB = 'OPENING_DRAFT_TAB';
const ENGLISH_SITE_TITLE = 'ENGLISH_SITE_TITLE';
const ENGLISH_DESCRIPTION = 'ENGLISH_DESCRIPTION';
const ENGLISH_SECTION = 'ENGLISH_SECTION';
const ENGLISH_TAB = 'ENGLISH_TAB';

type FakeRouteSnapshot = {
  data?: Readonly<Record<string, unknown>>;
  firstChild?: FakeRouteSnapshot | null;
};

type FakeRouter = {
  events: Subject<unknown>;
  routerState: {
    snapshot: {
      root: FakeRouteSnapshot;
    };
  };
  url: string;
};

class FakeTranslateService {
  currentLang = 'fi';
  private translations: Record<string, string>;
  readonly onLangChange = new Subject<LangChangeEvent>();

  constructor(translations: Record<string, string>) {
    this.translations = translations;
  }

  setTranslations(translations: Record<string, string>): void {
    this.translations = translations;
  }

  get(keys: string[]): Observable<Record<string, string>> {
    return of(
      Object.fromEntries(
        keys
          .filter((key) => Object.hasOwn(this.translations, key))
          .map((key) => [key, this.translations[key]]),
      ),
    );
  }
}

function createRouteSnapshot(
  seo?: RouteSeoData,
  firstChild?: FakeRouteSnapshot | null,
): FakeRouteSnapshot {
  return {
    data: seo ? { seo } : undefined,
    firstChild: firstChild ?? null,
  };
}

function createFakeRouter(root: FakeRouteSnapshot, url: string): FakeRouter {
  return {
    events: new Subject<unknown>(),
    routerState: {
      snapshot: {
        root,
      },
    },
    url,
  };
}

function getMetaContent(
  doc: Document,
  selector: string,
): string | null {
  return doc.head.querySelector(selector)?.getAttribute('content') ?? null;
}

describe('SeoService', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function configure(options?: {
    root?: FakeRouteSnapshot;
    url?: string;
    translations?: Record<string, string>;
  }) {
    const doc = document.implementation.createHTMLDocument('SEO');
    const router = createFakeRouter(
      options?.root ?? createRouteSnapshot(),
      options?.url ?? '/',
    );
    const translate = new FakeTranslateService(
      options?.translations ?? {
        pageTitle: SITE_TITLE,
        'seo.description': DEFAULT_DESCRIPTION,
        'nav.playerCareers': CAREER_SECTION,
        'career.tabs.goalies': GOALIES_TAB,
        'nav.drafts': DRAFT_SECTION,
        'draft.tabs.openingDraft': OPENING_DRAFT_TAB,
      },
    );

    TestBed.configureTestingModule({
      providers: [
        SeoService,
        { provide: DOCUMENT, useValue: doc },
        { provide: Router, useValue: router as unknown as Router },
        {
          provide: TranslateService,
          useValue: translate as unknown as TranslateService,
        },
      ],
    });

    TestBed.inject(SeoService);

    return { doc, router, translate };
  }

  it('applies the default front-page metadata on initial sync', () => {
    const { doc } = configure();

    expect(doc.title).toBe(SITE_TITLE);
    expect(doc.documentElement.lang).toBe('fi');
    expect(getMetaContent(doc, 'meta[name="description"]')).toBe(DEFAULT_DESCRIPTION);
    expect(getMetaContent(doc, 'meta[property="og:title"]')).toBe(SITE_TITLE);
    expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'http://localhost:4200/',
    );
  });

  it('builds route titles from merged section and tab translation keys', () => {
    const { doc, router } = configure();

    router.routerState.snapshot.root = createRouteSnapshot(
      { sectionKey: 'nav.playerCareers' },
      createRouteSnapshot({ tabKey: 'career.tabs.goalies' }),
    );
    router.url = '/career/goalies?sort=name';
    router.events.next(
      new NavigationEnd(1, '/career/goalies?sort=name', '/career/goalies?sort=name'),
    );

    const expectedTitle = `${SITE_TITLE} | ${CAREER_SECTION} | ${GOALIES_TAB}`;

    expect(doc.title).toBe(expectedTitle);
    expect(getMetaContent(doc, 'meta[name="twitter:title"]')).toBe(expectedTitle);
    expect(getMetaContent(doc, 'meta[property="og:url"]')).toBe(
      'http://localhost:4200/career/goalies',
    );
  });

  it('builds draft route titles from merged section and tab translation keys', () => {
    const { doc, router } = configure();

    router.routerState.snapshot.root = createRouteSnapshot(
      { sectionKey: 'nav.drafts' },
      createRouteSnapshot({ tabKey: 'draft.tabs.openingDraft' }),
    );
    router.url = '/draft/opening-draft';
    router.events.next(new NavigationEnd(4, '/draft/opening-draft', '/draft/opening-draft'));

    const expectedTitle = `${SITE_TITLE} | ${DRAFT_SECTION} | ${OPENING_DRAFT_TAB}`;

    expect(doc.title).toBe(expectedTitle);
    expect(getMetaContent(doc, 'meta[property="og:url"]')).toBe(
      'http://localhost:4200/draft/opening-draft',
    );
  });

  it('refreshes the document language and title when translations change', () => {
    const { doc, router, translate } = configure({
      root: createRouteSnapshot(
        { sectionKey: 'nav.playerCareers' },
        createRouteSnapshot({ tabKey: 'career.tabs.goalies' }),
      ),
      url: '/career/goalies',
    });

    translate.currentLang = 'en';
    translate.setTranslations({
      pageTitle: ENGLISH_SITE_TITLE,
      'seo.description': ENGLISH_DESCRIPTION,
      'nav.playerCareers': ENGLISH_SECTION,
      'career.tabs.goalies': ENGLISH_TAB,
    });
    translate.onLangChange.next({
      lang: 'en',
      translations: {},
    } as LangChangeEvent);
    router.events.next(new NavigationEnd(2, '/career/goalies', '/career/goalies'));

    expect(doc.documentElement.lang).toBe('en');
    expect(doc.title).toBe(
      `${ENGLISH_SITE_TITLE} | ${ENGLISH_SECTION} | ${ENGLISH_TAB}`,
    );
    expect(getMetaContent(doc, 'meta[name="description"]')).toBe(ENGLISH_DESCRIPTION);
  });

  it('defaults the document language to fi when ngx-translate has not set one yet', () => {
    const { doc, router, translate } = configure({
      root: createRouteSnapshot(
        { sectionKey: 'nav.playerCareers' },
        createRouteSnapshot({ tabKey: 'career.tabs.goalies' }),
      ),
      url: '/career/goalies',
    });

    translate.currentLang = '';
    translate.onLangChange.next({
      lang: '',
      translations: {},
    } as LangChangeEvent);
    router.events.next(new NavigationEnd(3, '/career/goalies', '/career/goalies'));

    expect(doc.documentElement.lang).toBe('fi');
  });

  it('uses the production site url for canonical and social image metadata in production builds', () => {
    const originalProduction = environment.production;
    environment.production = true;

    try {
      const { doc } = configure({
        url: '/career/goalies?sort=name',
      });

      expect(doc.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
        'https://ffhl-stats.vercel.app/career/goalies',
      );
      expect(getMetaContent(doc, 'meta[property="og:image"]')).toBe(
        'https://ffhl-stats.vercel.app/icons/icon-512.png',
      );
      expect(getMetaContent(doc, 'meta[name="twitter:image"]')).toBe(
        'https://ffhl-stats.vercel.app/icons/icon-512.png',
      );
    } finally {
      environment.production = originalProduction;
    }
  });
});
