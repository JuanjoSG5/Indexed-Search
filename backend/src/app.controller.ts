import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './product/entities/product.entity.js';
import { Repository } from 'typeorm';

@Controller()
export class AppController {
  constructor(
    @InjectRepository(Product)
      private readonly productRepository: Repository<Product>,
    
  ) {}

  @Get('status')
  async getStatus() {
    const count = await this.productRepository.count({take: 1});

    return {
      status: 'ok',
      db_active: count !== undefined,
      timestamp: new Date().toISOString(),
    }
  }
}
