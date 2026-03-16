export type RouteSeoData = Readonly<{
  sectionKey?: string;
  tabKey?: string;
}>;

type RouteSnapshotLike = {
  readonly data?: Readonly<Record<string, unknown>>;
  readonly firstChild?: RouteSnapshotLike | null;
};

export function buildPageTitle(
  siteTitle: string,
  sectionName?: string | null,
  tabName?: string | null,
): string {
  return [siteTitle, sectionName, tabName]
    .filter((part): part is string => Boolean(part))
    .join(' | ');
}

export function buildSeoTranslationKeys(routeSeo: RouteSeoData): string[] {
  return ['pageTitle', 'seo.description', routeSeo.sectionKey, routeSeo.tabKey]
    .filter((key): key is string => Boolean(key));
}

export function normalizeSeoPath(url: string): string {
  const normalizedUrl = url.split('?')[0]?.split('#')[0] ?? '/';
  return normalizedUrl || '/';
}

export function resolveActiveRouteSeo(
  routeSnapshot: RouteSnapshotLike | null | undefined,
): RouteSeoData {
  let current = routeSnapshot ?? null;
  let resolved: RouteSeoData = {};

  while (current) {
    const seo = current.data?.['seo'];

    if (isRouteSeoData(seo)) {
      resolved = {
        ...resolved,
        ...seo,
      };
    }

    current = current.firstChild ?? null;
  }

  return resolved;
}

function isRouteSeoData(value: unknown): value is RouteSeoData {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'sectionKey' in value || 'tabKey' in value;
}
