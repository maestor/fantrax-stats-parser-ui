import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, map, merge, of, switchMap } from 'rxjs';

import {
  buildPageTitle,
  buildSeoTranslationKeys,
  normalizeSeoPath,
  resolveActiveRouteSeo,
  RouteSeoData,
} from '@shared/utils/seo.utils';
import { environment } from '../../environments/environment';

const PRODUCTION_SITE_URL = 'https://ffhl-stats.vercel.app';
const DEVELOPMENT_SITE_URL = 'http://localhost:4200';
const DEFAULT_SOCIAL_IMAGE_PATH = '/icons/icon-512.png';

type SeoTranslations = Readonly<Record<string, string>>;

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly translateService = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    merge(
      of(null),
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      ),
      this.translateService.onLangChange.pipe(map(() => null)),
    )
      .pipe(
        switchMap(() => {
          const routeSeo = resolveActiveRouteSeo(this.router.routerState.snapshot.root);

          return this.translateService.get(buildSeoTranslationKeys(routeSeo)).pipe(
            map((translations) => ({
              routeSeo,
              translations: translations as SeoTranslations,
            })),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ routeSeo, translations }) => {
        this.applySeo(routeSeo, translations);
      });
  }

  private applySeo(routeSeo: RouteSeoData, translations: SeoTranslations): void {
    const siteTitle = translations['pageTitle']!;
    const description = translations['seo.description']!;
    const sectionName = routeSeo.sectionKey ? translations[routeSeo.sectionKey]! : null;
    const tabName = routeSeo.tabKey ? translations[routeSeo.tabKey]! : null;
    const canonicalUrl = this.absoluteUrlFor(normalizeSeoPath(this.router.url));
    const socialImageUrl = this.absoluteUrlFor(DEFAULT_SOCIAL_IMAGE_PATH);
    const title = buildPageTitle(siteTitle, sectionName, tabName);
    const lang = this.translateService.currentLang || 'fi';

    this.document.title = title;
    this.document.documentElement.lang = lang;

    this.upsertCanonicalLink(canonicalUrl);
    this.upsertMetaTag(`meta[name="description"]`, 'name', 'description', description);
    this.upsertMetaTag(`meta[name="robots"]`, 'name', 'robots', 'index,follow');
    this.upsertMetaTag(`meta[property="og:title"]`, 'property', 'og:title', title);
    this.upsertMetaTag(
      `meta[property="og:description"]`,
      'property',
      'og:description',
      description,
    );
    this.upsertMetaTag(`meta[property="og:type"]`, 'property', 'og:type', 'website');
    this.upsertMetaTag(
      `meta[property="og:site_name"]`,
      'property',
      'og:site_name',
      siteTitle,
    );
    this.upsertMetaTag(`meta[property="og:url"]`, 'property', 'og:url', canonicalUrl);
    this.upsertMetaTag(
      `meta[property="og:image"]`,
      'property',
      'og:image',
      socialImageUrl,
    );
    this.upsertMetaTag(`meta[name="twitter:card"]`, 'name', 'twitter:card', 'summary');
    this.upsertMetaTag(`meta[name="twitter:title"]`, 'name', 'twitter:title', title);
    this.upsertMetaTag(
      `meta[name="twitter:description"]`,
      'name',
      'twitter:description',
      description,
    );
    this.upsertMetaTag(
      `meta[name="twitter:image"]`,
      'name',
      'twitter:image',
      socialImageUrl,
    );
  }

  private absoluteUrlFor(path: string): string {
    return new URL(
      path,
      environment.production ? PRODUCTION_SITE_URL : DEVELOPMENT_SITE_URL,
    ).toString();
  }

  private upsertCanonicalLink(href: string): void {
    let canonical = this.document.head.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement | null;

    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }

    canonical.setAttribute('href', href);
  }

  private upsertMetaTag(
    selector: string,
    attributeName: 'name' | 'property',
    attributeValue: string,
    content: string,
  ): void {
    let metaTag = this.document.head.querySelector(selector) as HTMLMetaElement | null;

    if (!metaTag) {
      metaTag = this.document.createElement('meta');
      metaTag.setAttribute(attributeName, attributeValue);
      this.document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', content);
  }
}
