import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from '../common/product';
import { ProductCategory } from '../common/product-category';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private baseUrl = `${environment.luv2shopApiUrl}/products`;
  private categoryUrl = `${environment.luv2shopApiUrl}/product-category`;

  constructor(private httpClient: HttpClient) {}

  getProduct(id: string | number): Observable<Product> {
    return this.httpClient.get<Product>(`${this.baseUrl}/${id}`);
  }

  getAllProductsPaginate(page: number, size: number, sort?: string): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (sort) params = params.set('sort', sort);

    return this.httpClient.get<any>(`${this.baseUrl}/search/findByActiveTrue`, { params });
  }

  getProductListPaginate(page: number, size: number, categoryId: number, sort?: string): Observable<any> {
    let params = new HttpParams()
      .set('id', categoryId)
      .set('page', page)
      .set('size', size);

    if (sort) params = params.set('sort', sort);

    return this.httpClient.get<any>(
      `${this.baseUrl}/search/findByCategoryIdAndActiveTrue`,
      { params }
    );
  }

  searchProductsPaginate(page: number, size: number, keyword: string, sort?: string): Observable<any> {
    const cleanKeyword = keyword.trim();

    if (!cleanKeyword) {
      return this.getAllProductsPaginate(page, size, sort);
    }

    let params = new HttpParams()
      .set('name', cleanKeyword)
      .set('page', page)
      .set('size', size);

    if (sort) params = params.set('sort', sort);

    return this.httpClient.get<any>(
      `${this.baseUrl}/search/findByNameContainingIgnoreCaseAndActiveTrue`,
      { params }
    );
  }

  getProductCategories(): Observable<ProductCategory[]> {
    return this.httpClient.get<any>(this.categoryUrl).pipe(
      map(response => response?._embedded?.productCategory ?? [])
    );
  }
}
