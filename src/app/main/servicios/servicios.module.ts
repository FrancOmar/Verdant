import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CoreCommonModule } from '@core/common.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';

import { ServiciosComponent } from './servicios.component';
import { AuthGuard } from 'app/auth/helpers';

const routes = [
  {
    path: 'servicios',
    component: ServiciosComponent,
    canActivate: [AuthGuard],
    data: { animation: 'servicios' }
  }
];

@NgModule({
  declarations: [ServiciosComponent],
  imports: [
    RouterModule.forChild(routes),
    ContentHeaderModule,
    TranslateModule,
    CoreCommonModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [ServiciosComponent]
})
export class ServiciosModule {}
