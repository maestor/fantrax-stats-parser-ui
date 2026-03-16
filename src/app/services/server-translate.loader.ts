import { Injectable } from '@angular/core';
import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

import fiTranslations from '../../../public/i18n/fi.json';

const SERVER_TRANSLATIONS: Readonly<Record<string, TranslationObject>> = {
  fi: fiTranslations as TranslationObject,
};

@Injectable({
  providedIn: 'root',
})
export class ServerTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<TranslationObject> {
    return of(SERVER_TRANSLATIONS[lang] ?? SERVER_TRANSLATIONS['fi']);
  }
}
