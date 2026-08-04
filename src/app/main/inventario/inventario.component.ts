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
import { InventarioService, InventarioItem } from './inventario.service';

@Component({
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  public contentHeader: object;
  public inventoryItems: InventarioItem[] = [];
  public categories: string[] = ['Refrescos', 'Licores y Alcohol', 'Natural / Energizante'];
  
  public productForm: FormGroup;
  public submitted = false;
  public isEditMode = false;
  public editingId: number = null;

  constructor(
    private _coreTranslationService: CoreTranslationService,
    private modalService: NgbModal,
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private _inventarioService: InventarioService
  ) {
    this._coreTranslationService.translate(en, fr, de, pt, es);
  }

  ngOnInit(): void {
    // Header config
    this.contentHeader = {
      headerTitle: 'Inventario',
      actionButton: false,
      breadcrumb: {
        type: '',
        links: [
          {
            name: 'Home',
            isLink: true,
            link: '/'
          },
          {
            name: 'Inventario',
            isLink: false
          }
        ]
      }
    };

    // Subscribirse al servicio de inventario para actualizaciones automáticas
    this._inventarioService.getItems$().subscribe(items => {
      this.inventoryItems = items;
    });

    // Init form
    this.productForm = this.formBuilder.group({
      name: ['', Validators.required],
      sku: ['', Validators.required],
      category: ['', Validators.required],
      stock: [0, [Validators.required, Validators.min(0)]],
      price: [0, [Validators.required, Validators.min(0)]]
    });
  }

  // Getters for form validation
  get f() {
    return this.productForm.controls;
  }

  // Open modal
  openAddModal(modalRef: any): void {
    this.isEditMode = false;
    this.editingId = null;
    this.submitted = false;
    this.productForm.reset({
      name: '',
      sku: '',
      category: '',
      stock: 0,
      price: 0
    });
    this.modalService.open(modalRef, {
      centered: true,
      windowClass: 'modal-slide-in'
    });
  }

  // Open edit modal
  openEditModal(modalRef: any, product: InventarioItem): void {
    this.isEditMode = true;
    this.editingId = product.id;
    this.submitted = false;
    this.productForm.patchValue({
      name: product.name,
      sku: product.sku,
      category: product.category,
      stock: product.stock,
      price: product.price
    });
    this.modalService.open(modalRef, {
      centered: true,
      windowClass: 'modal-slide-in'
    });
  }

  // Save new product or update existing
  onSubmit(modal: any): void {
    this.submitted = true;

    if (this.productForm.invalid) {
      return;
    }

    const formValues = this.productForm.value;

    if (this.isEditMode) {
      this._inventarioService.updateItem(
        this.editingId,
        formValues.name,
        formValues.sku,
        formValues.category,
        formValues.stock,
        formValues.price
      );
      modal.close();
      this.toastr.success('¡Producto modificado con éxito!', 'Inventario', {
        toastClass: 'toast ngx-toastr',
        closeButton: true,
        tapToDismiss: false
      });
    } else {
      this._inventarioService.addItem(
        formValues.name,
        formValues.sku,
        formValues.category,
        formValues.stock,
        formValues.price
      );
      modal.close();
      this.toastr.success('¡Producto adicionado con éxito!', 'Inventario', {
        toastClass: 'toast ngx-toastr',
        closeButton: true,
        tapToDismiss: false
      });
    }
  }

  // Delete product
  deleteItem(id: number): void {
    this._inventarioService.deleteItem(id);
    this.toastr.warning('Producto eliminado del inventario.', 'Inventario', {
      toastClass: 'toast ngx-toastr',
      closeButton: true,
      tapToDismiss: false
    });
  }
}
