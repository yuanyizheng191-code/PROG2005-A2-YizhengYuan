import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cart',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './cart.html',
    styleUrls: ['./cart.css']
})
export class CartComponent {
    constructor() { }
}