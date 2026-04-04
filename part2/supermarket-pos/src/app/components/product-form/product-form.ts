import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './product-form.html',
    styleUrls: ['./product-form.css']
})
export class ProductFormComponent {
    constructor() { }
}