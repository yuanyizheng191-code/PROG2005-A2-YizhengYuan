import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from './services/cart.service';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
    title = 'supermarket-pos';
    currentDate: string = '';
    cartItemsCount: number = 0;
    private cartSubscription: Subscription = new Subscription();

    constructor(private cartService: CartService) {}

    ngOnInit(): void {
        this.updateDate();
        this.cartSubscription = this.cartService.summary$.subscribe(summary => {
            this.cartItemsCount = summary.totalItems;
        });
    }

    ngOnDestroy(): void {
        if (this.cartSubscription) {
            this.cartSubscription.unsubscribe();
        }
    }

    private updateDate(): void {
        const now = new Date();
        this.currentDate = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short'
        });
    }
}