import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-product-list',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './product-list.html',
    styleUrls: ['./product-list.css']
})
export class ProductListComponent {
    constructor() { }
}