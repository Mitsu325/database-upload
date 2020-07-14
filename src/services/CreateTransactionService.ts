import { getCustomRepository, getRepository } from 'typeorm';

import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Unable to transaction 🙁');
    }

    // Verificar se existe category na tabela
    const checkCategory = await categoriesRepository.findOne({
      where: { title: category },
    });

    let category_id: string;

    if (!checkCategory) {
      const categoryCreate = categoriesRepository.create({
        title: category,
      });

      await categoriesRepository.save(categoryCreate);

      category_id = categoryCreate.id;
    } else {
      category_id = checkCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
