import { Component, OnInit } from '@angular/core';
import { Product } from '../../common/product';
import { ProductService } from '../../services/product';
import { ActivatedRoute } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { CartItem } from '../../common/cart-item';

@Component({
  selector: 'app-product-details',
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {
  product!: Product;
  quantity = 1;
  loading = true;
  errorMessage = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => this.handleProductDetails());
  }

  handleProductDetails(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage = 'Product not found.';
      this.loading = false;
      return;
    }

    this.productService.getProduct(id).subscribe({
      next: data => {
        this.product = data;
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'This product could not be found.';
        this.loading = false;
      }
    });
  }

  increase(): void {
    if (this.product && this.quantity < Math.min(this.product.unitsInStock, 50)) {
      this.quantity++;
    }
  }

  decrease(): void {
    if (this.quantity > 1) this.quantity--;
  }

  addToCart(): void {
    const item = new CartItem(this.product);
    item.quantity = this.quantity;
    this.cartService.addToCart(item);
  }
}
