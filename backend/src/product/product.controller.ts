import { Controller, Get, HttpException, HttpStatus, Query } from '@nestjs/common';
import { ProductService } from './product.service.js';

@Controller('search')
export class ProductController {
  constructor(private readonly productService: ProductService) {}
  @Get()
  async search(@Query('q') query: string) {
    // If the service is running in background, tell the user to wait
    if (!this.productService.isReady) {
        throw new HttpException('Server is warming up... try again in 30s', HttpStatus.SERVICE_UNAVAILABLE);
    }
    return this.productService.searchProducts(query);
  }
}