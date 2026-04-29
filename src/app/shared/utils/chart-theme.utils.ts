type ChartSeriesTokenConfig = {
  strokeVar: string;
  strokeFallback: string;
  fillVar: string;
  fillFallback: string;
};

export type ChartSeriesColors = {
  lineColor: string;
  fillColor: string;
  pointBackgroundColor: string;
  pointBorderColor: string;
  pointHoverBackgroundColor: string;
  pointHoverBorderColor: string;
};

const CHART_SERIES_TOKENS: readonly ChartSeriesTokenConfig[] = [
  {
    strokeVar: '--app-chart-series-1',
    strokeFallback: '#1976d2',
    fillVar: '--app-chart-series-1-fill',
    fillFallback: 'rgba(25, 118, 210, 0.3)',
  },
  {
    strokeVar: '--app-chart-series-2',
    strokeFallback: '#ff9800',
    fillVar: '--app-chart-series-2-fill',
    fillFallback: 'rgba(255, 152, 0, 0.3)',
  },
  {
    strokeVar: '--app-chart-series-3',
    strokeFallback: '#388e3c',
    fillVar: '--app-chart-series-3-fill',
    fillFallback: 'rgba(56, 142, 60, 0.3)',
  },
  {
    strokeVar: '--app-chart-series-4',
    strokeFallback: '#fbc02d',
    fillVar: '--app-chart-series-4-fill',
    fillFallback: 'rgba(251, 192, 45, 0.3)',
  },
  {
    strokeVar: '--app-chart-series-5',
    strokeFallback: '#7b1fa2',
    fillVar: '--app-chart-series-5-fill',
    fillFallback: 'rgba(123, 31, 162, 0.3)',
  },
  {
    strokeVar: '--app-chart-series-6',
    strokeFallback: '#00838f',
    fillVar: '--app-chart-series-6-fill',
    fillFallback: 'rgba(0, 131, 143, 0.3)',
  },
] as const;

function createHiddenProbeElement(document: Document): HTMLSpanElement {
  const el = document.createElement('span');
  el.setAttribute('aria-hidden', 'true');
  el.style.position = 'absolute';
  el.style.width = '0';
  el.style.height = '0';
  el.style.overflow = 'hidden';
  return el;
}

function detectUsedColorScheme(
  document: Document,
  body: HTMLElement,
  knownScheme: 'light' | 'dark' | undefined,
): 'light' | 'dark' | undefined {
  if (knownScheme) {
    return knownScheme;
  }

  const schemeProbe = createHiddenProbeElement(document);
  schemeProbe.style.color = 'light-dark(rgb(1, 2, 3), rgb(4, 5, 6))';
  body.appendChild(schemeProbe);

  const observed = getComputedStyle(schemeProbe).color?.trim();
  schemeProbe.remove();

  if (observed === 'rgb(1, 2, 3)') return 'light';
  if (observed === 'rgb(4, 5, 6)') return 'dark';
  return undefined;
}

export function resolveThemedCssColorVar(
  document: Document,
  name: string,
  fallback: string,
  cssProperty: 'color' | 'backgroundColor' = 'color',
): string {
  try {
    const body = document.body;
    if (!body) {
      return fallback;
    }

    const root = document.documentElement;
    const rootStyle = root ? getComputedStyle(root) : undefined;
    const directRootValue = rootStyle?.getPropertyValue(name)?.trim();
    const computedSchemeRaw =
      (rootStyle as CSSStyleDeclaration & { colorScheme?: string })?.colorScheme ||
      rootStyle?.getPropertyValue('color-scheme') ||
      '';
    const schemeTokens = computedSchemeRaw.trim().split(/\s+/).filter(Boolean);
    const schemeToken = schemeTokens.length === 1 ? schemeTokens[0] : undefined;

    const scheme: 'light' | 'dark' | undefined =
      schemeToken === 'dark' || schemeToken === 'light'
        ? (schemeToken as 'light' | 'dark')
        : undefined;

    const usedScheme = detectUsedColorScheme(document, body, scheme);
    const probe = createHiddenProbeElement(document);
    if (usedScheme) {
      probe.style.setProperty('color-scheme', usedScheme);
    }

    if (cssProperty === 'backgroundColor') {
      probe.style.backgroundColor = `var(${name})`;
    } else {
      probe.style.color = `var(${name})`;
    }

    body.appendChild(probe);
    const computed = getComputedStyle(probe)[cssProperty];
    probe.remove();

    const resolved = computed?.trim();
    if (resolved && !resolved.startsWith('var(')) {
      return resolved;
    }

    if (directRootValue && !directRootValue.startsWith('var(')) {
      return directRootValue;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export function getChartSeriesColors(document: Document, index: number): ChartSeriesColors {
  const normalizedIndex = ((index % CHART_SERIES_TOKENS.length) + CHART_SERIES_TOKENS.length) %
    CHART_SERIES_TOKENS.length;
  const tokenConfig = CHART_SERIES_TOKENS[normalizedIndex];
  const pointContrastColor = resolveThemedCssColorVar(
    document,
    '--mat-sys-surface',
    '#ffffff',
  );
  const lineColor = resolveThemedCssColorVar(
    document,
    tokenConfig.strokeVar,
    tokenConfig.strokeFallback,
  );
  const fillColor = resolveThemedCssColorVar(
    document,
    tokenConfig.fillVar,
    tokenConfig.fillFallback,
    'backgroundColor',
  );

  return {
    lineColor,
    fillColor,
    pointBackgroundColor: lineColor,
    pointBorderColor: pointContrastColor,
    pointHoverBackgroundColor: pointContrastColor,
    pointHoverBorderColor: lineColor,
  };
}
