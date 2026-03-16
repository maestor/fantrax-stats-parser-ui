import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { provideTranslateLoader } from '@ngx-translate/core';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { ServerTranslateLoader } from '@services/server-translate.loader';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideTranslateLoader(ServerTranslateLoader),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
