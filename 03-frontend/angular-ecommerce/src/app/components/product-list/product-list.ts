import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../common/product';
import { ProductService } from '../../services/product';
import { CartItem } from '../../common/cart-item';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list-grid.html',
  styleUrls: ['./product-list.css'],
  standalone: false
})
export class ProductList implements OnInit {
  products: Product[] = [];
  currentCategoryId?: number;
  searchMode = false;
  searchKeyword = '';
  thePageNumber = 1;
  thePageSize = 8;
  theTotalElements = 0;
  previousKeyword = '';
  previousCategoryId?: number;
  sort = 'featured';
  loading = false;
  errorMessage = '';

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => this.listProducts());
  }

  listProducts(): void {
    this.searchMode = this.route.snapshot.paramMap.has('keyword');
    this.errorMessage = '';

    if (this.searchMode) {
      this.handleSearchProducts();
    } else {
      this.handleListProducts();
    }
  }

  handleSearchProducts(): void {
    const keyword = this.route.snapshot.paramMap.get('keyword')?.trim() ?? '';

    if (this.previousKeyword !== keyword) {
      this.thePageNumber = 1;
    }

    this.previousKeyword = keyword;
    this.searchKeyword = keyword;

    this.loadProducts(
      this.productService.searchProductsPaginate(
        this.thePageNumber - 1,
        this.thePageSize,
        keyword,
        this.getSort()
      )
    );
  }

  handleListProducts(): void {
    const rawCategoryId = this.route.snapshot.paramMap.get('id');
    const categoryId = rawCategoryId ? Number(rawCategoryId) : undefined;

    if (categoryId !== undefined && !Number.isInteger(categoryId)) {
      this.products = [];
      this.errorMessage = 'That category could not be found.';
      return;
    }

    if (this.previousCategoryId !== categoryId) {
      this.thePageNumber = 1;
    }

    this.previousCategoryId = categoryId;
    this.currentCategoryId = categoryId;

    const request = categoryId === undefined
      ? this.productService.getAllProductsPaginate(this.thePageNumber - 1, this.thePageSize, this.getSort())
      : this.productService.getProductListPaginate(
          this.thePageNumber - 1,
          this.thePageSize,
          categoryId,
          this.getSort()
        );

    this.loadProducts(request);
  }

  updatePageSize(pageSize: string): void {
    const parsed = Number(pageSize);
    if (!Number.isInteger(parsed) || parsed < 1) return;

    this.thePageSize = parsed;
    this.thePageNumber = 1;
    this.listProducts();
  }

  updateSort(sort: string): void {
    this.sort = sort;
    this.thePageNumber = 1;
    this.listProducts();
  }

  private getSort(): string | undefined {
    switch (this.sort) {
      case 'priceAsc': return 'discountPrice,asc';
      case 'priceDesc': return 'discountPrice,desc';
      case 'newest': return 'dateCreated,desc';
      case 'name': return 'name,asc';
      case 'rating': return 'rating,desc';
      default: return 'rating,desc';
    }
  }

  private loadProducts(request: any): void {
    this.loading = true;

    request.subscribe({
      next: (data: any) => {
        this.products = data?._embedded?.products ?? [];
        this.thePageNumber = (data?.page?.number ?? 0) + 1;
        this.thePageSize = data?.page?.size ?? this.thePageSize;
        this.theTotalElements = data?.page?.totalElements ?? 0;
        this.loading = false;
      },
      error: (err: any) => {
        this.products = [];
        this.loading = false;
        this.errorMessage = err?.status === 404
          ? 'We could not find products for this selection.'
          : 'We could not load products. Please try again.';
      }
    });
  }

  addToCart(product: Product): void {
    if (product.unitsInStock <= 0) return;
    this.cartService.addToCart(new CartItem(product));
  }
}
