import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductModule } from './product/product.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Product } from './product/entities/product.entity.js';
import { ProductController } from './product/product.controller.js';
import { ProductService } from './product/product.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Product]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('SUPABASE_URL'),
        autoLoadEntities: true,
        synchronize: false,
        ssl: { rejectUnauthorized: false },
        extra: {
          family: 4,
          min: 1,
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 30000,
        },
      }),
    }),
    ProductModule,
  ],
  controllers: [AppController, ProductController],
  providers: [AppService, ProductService],
})
export class AppModule {}