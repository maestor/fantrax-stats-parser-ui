import { NgModule } from '@angular/core';
import { provideTranslateService } from '@ngx-translate/core';

import { TRANSLATE_IMPORTS } from '@shared/translate/translate-imports';

@NgModule({
  imports: [...TRANSLATE_IMPORTS],
  exports: [...TRANSLATE_IMPORTS],
  providers: [
    ...provideTranslateService({
      lang: 'fi',
      fallbackLang: 'fi',
    }),
  ],
})
export class TranslateTestingModule {}
