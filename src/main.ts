// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, {
  providers: [provideHttpClient(), ...appConfig.providers],
})
  .catch(err => console.error(err));
// <-- это стандартный способ обработки ошибок в Promise. Если bootstrapApplication отклонит свой Promise
// (то есть, произойдет ошибка при запуске),
// эта ошибка будет перехвачена и выведена в консоль браузера, что очень полезно для отладки.
