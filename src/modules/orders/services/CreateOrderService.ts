import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';
import Product from '@modules/products/infra/typeorm/entities/Product';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customerExists = await this.customersRepository.findById(customer_id);

    if (!customerExists) {
      throw new AppError('Could not find any customer with the given id');
    }

    const productsExists = await this.productsRepository.findAllById(products);

    if (!productsExists.length) {
      throw new AppError('Could not find any products with the given ids');
    }

    const productsExistsIds = productsExists.map(product => product.id);

    const checkPoductsNotExists = products.filter(
      product => !productsExistsIds.includes(product.id)
    );

    if (checkPoductsNotExists.length) {
      throw new AppError(`Could not find product ${checkPoductsNotExists[0].id}`);
    }

    const findProductsWithoutQuantityAvailable = products.filter(
      product => productsExists.filter(p => p.id === product.id)[0].quantity < product.quantity,
    );

    if (findProductsWithoutQuantityAvailable.length) {
      throw new AppError(`The quantity ${findProductsWithoutQuantityAvailable[0].quantity} is not available for ${findProductsWithoutQuantityAvailable[0].id}`);
    }

    const serializedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: productsExists.filter(p => p.id == product.id)[0].price,
    }));

    const order = await this.ordersRepository.create({
      customer: customerExists,
      products: serializedProducts,
    });

    const { order_products } = order;

    const productsQuantity = order_products.map(product => ({
      id: product.product_id,
      quantity:
        productsExists.filter(p => p.id === product.product_id)[0].quantity -
        product.quantity,
    }));

    await this.productsRepository.updateQuantity(productsQuantity);

    return order;
  }
}

export default CreateOrderService;
