import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { ProductListComponent } from './components/product-list/product-list';
import { ProductFormComponent } from './components/product-form/product-form';
import { CartComponent } from './components/cart/cart';
import { SearchComponent } from './components/search/search';
import { PrivacyComponent } from './components/privacy/privacy';
import { HelpComponent } from './components/help/help';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'products', component: ProductListComponent },
    { path: 'add-product', component: ProductFormComponent },
    { path: 'edit-product/:barcode', component: ProductFormComponent },
    { path: 'cart', component: CartComponent },
    { path: 'search', component: SearchComponent },
    { path: 'privacy', component: PrivacyComponent },
    { path: 'help', component: HelpComponent },
    { path: '**', redirectTo: '' }
];