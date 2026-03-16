import { firstValueFrom } from 'rxjs';

import fiTranslations from '../../../public/i18n/fi.json';
import { ServerTranslateLoader } from './server-translate.loader';

describe('ServerTranslateLoader', () => {
  it('returns the bundled Finnish translations for fi', async () => {
    const loader = new ServerTranslateLoader();

    await expect(firstValueFrom(loader.getTranslation('fi'))).resolves.toEqual(fiTranslations);
  });

  it('falls back to the bundled Finnish translations for unknown languages', async () => {
    const loader = new ServerTranslateLoader();

    await expect(firstValueFrom(loader.getTranslation('en'))).resolves.toEqual(fiTranslations);
  });
});
