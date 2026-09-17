export class Product {
  constructor(
    public id: string = '',
    public sku: string = '',
    public name: string = '',
    public description: string = '',
    public unitPrice: number = 0,
    public imageUrl: string = '',
    public active: boolean = true,
    public unitsInStock: number = 0,
    public dateCreated: Date = new Date(),
    public lastUpdated: Date = new Date(),
    public brand?: string,
    public discountPrice?: number,
    public rating?: number,
    public reviewCount?: number
  ) {}
}
