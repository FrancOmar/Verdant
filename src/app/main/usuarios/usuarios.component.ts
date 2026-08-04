import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { locale as en } from './i18n/en';
import { locale as de } from './i18n/de';
import { locale as fr } from './i18n/fr';
import { locale as pt } from './i18n/pt';
import { locale as es } from './i18n/es';

import { CoreTranslationService } from '@core/services/translation.service';

interface UserItem {
  id: number;
  fullName: string;
  username: string;
  role: 'ADMIN' | 'STAFF' | 'CLIENT';
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.scss']
})
export class UsuariosComponent implements OnInit {
  public contentHeader: object;
  public userItems: UserItem[] = [
    {
      id: 1,
      fullName: 'Administrador Verdant',
      username: 'admin',
      role: 'ADMIN',
      status: 'ACTIVE'
    },
    {
      id: 2,
      fullName: 'Jane Smith',
      username: 'janesmith',
      role: 'STAFF',
      status: 'ACTIVE'
    },
    {
      id: 3,
      fullName: 'Bob Johnson',
      username: 'bjohnson',
      role: 'STAFF',
      status: 'INACTIVE'
    }
  ];

  public roles: string[] = ['ADMIN', 'STAFF', 'CLIENT'];
  public userForm: FormGroup;
  public submitted = false;

  constructor(
    private _coreTranslationService: CoreTranslationService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private toastr: ToastrService
  ) {
    this._coreTranslationService.translate(en, fr, de, pt, es);
  }

  ngOnInit(): void {
    // Header config
    this.contentHeader = {
      headerTitle: 'Usuarios',
      actionButton: false,
      breadcrumb: {
        type: '',
        links: [
          {
            name: 'Inicio',
            isLink: true,
            link: '/'
          },
          {
            name: 'Usuarios',
            isLink: false
          }
        ]
      }
    };

    // Init form
    this.userForm = this.formBuilder.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      role: ['', Validators.required],
      status: ['ACTIVE', Validators.required]
    });
  }

  // Getters for form validation
  get f() {
    return this.userForm.controls;
  }

  // Open modal
  openAddModal(modalRef: any): void {
    this.submitted = false;
    this.userForm.reset({
      fullName: '',
      username: '',
      role: '',
      status: 'ACTIVE'
    });
    this.modalService.open(modalRef, {
      centered: true,
      windowClass: 'modal-slide-in'
    });
  }

  // Save new user
  onSubmit(modal: any): void {
    this.submitted = true;

    if (this.userForm.invalid) {
      return;
    }

    const formValues = this.userForm.value;

    const newUser: UserItem = {
      id: this.userItems.length > 0 ? Math.max(...this.userItems.map(u => u.id)) + 1 : 1,
      fullName: formValues.fullName,
      username: formValues.username.toLowerCase(),
      role: formValues.role,
      status: formValues.status
    };

    this.userItems.push(newUser);
    
    modal.close();

    // Show toast
    this.toastr.success('¡Personal registrado con éxito!', 'Gestión de Personal', {
      toastClass: 'toast ngx-toastr',
      closeButton: true,
      tapToDismiss: false
    });
  }

  // Delete user
  deleteItem(id: number): void {
    // Prevent self-deletion of the main admin user
    const user = this.userItems.find(u => u.id === id);
    if (user && user.username === 'admin') {
      this.toastr.error('No se puede eliminar el usuario administrador principal.', 'Gestión de Personal', {
        toastClass: 'toast ngx-toastr',
        closeButton: true,
        tapToDismiss: false
      });
      return;
    }

    this.userItems = this.userItems.filter(u => u.id !== id);
    this.toastr.warning('Usuario removido con éxito.', 'Gestión de Personal', {
      toastClass: 'toast ngx-toastr',
      closeButton: true,
      tapToDismiss: false
    });
  }
}
