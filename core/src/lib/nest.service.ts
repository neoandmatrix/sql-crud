import { Repository, ObjectLiteral } from 'typeorm';

export class NestService<R extends ObjectLiteral> {
  private repository: Repository<R>;
  constructor(repository: Repository<R>) {
    this.repository = repository;
  }

  async findAll(): Promise<R[]> {
    return this.repository.find();
  }

  async findOne(id: number): Promise<R | null> {
    // TODO :: look into this as why any
    return this.repository.findOneBy({ id } as any);
  }

  async create(data: R): Promise<R> {
    return this.repository.save(data);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async update(id: number, data: R): Promise<R> {
    await this.repository.update(id, data);
    const entity = await this.repository.findOne({ id } as any);
    if (!entity) {
      throw new Error(`Entity with id ${id} not found`);
    }
    return entity;
  }
}
