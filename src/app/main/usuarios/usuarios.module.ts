import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CoreCommonModule } from '@core/common.module';
import { ContentHeaderModule } from 'app/layout/components/content-header/content-header.module';

import { UsuariosComponent } from './usuarios.component';
import { AuthGuard } from 'app/auth/helpers';

const routes = [
  {
    path: 'usuarios',
    component: UsuariosComponent,
    canActivate: [AuthGuard],
    data: { animation: 'usuarios' }
  }
];

@NgModule({
  declarations: [UsuariosComponent],
  imports: [
    RouterModule.forChild(routes),
    ContentHeaderModule,
    TranslateModule,
    CoreCommonModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [UsuariosComponent]
})
export class UsuariosModule {}
