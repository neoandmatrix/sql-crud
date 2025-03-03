/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { BadRequestException } from '@nestjs/common';
import {
  Repository,
  FindOptionsWhere,
  ObjectLiteral,
  DeepPartial,
} from 'typeorm';
import { PaginatedResponse } from '../lib/types/PaginatedResponse';
import { NestServiceOptions } from '../lib/types/ServiceOptions';
import options from '../utils/options';
import { nestify, NestifyFilters } from '../utils/nestify';
import {
  assignFilters,
  applyFiltersToQueryBuilder,
  FILTERS,
} from '../utils/query.utils';

export class NestService<T extends ObjectLiteral> {
  private repository: Repository<T>;
  private options: NestServiceOptions;

  constructor(repository: Repository<T>, serviceOptions?: NestServiceOptions) {
    this.repository = repository;
    this.options = serviceOptions || {
      multi: false,
      softDelete: true,
    };
  }

  async _find(
    query: Record<string, any> = {},
    findOptions = {
      handleSoftDelete: true,
    },
  ): Promise<PaginatedResponse<T> | T[]> {
    if (!findOptions.handleSoftDelete) {
      throw new BadRequestException(
        'findOptions.handleSoftDelete not provided in _find.',
      );
    }

    // Handle soft delete
    if (options.deleteKey && findOptions.handleSoftDelete) {
      query[options.deleteKey] = false;
    }

    // Extract filters for pagination, sorting, etc
    const filters = assignFilters({}, query, FILTERS, {});
    const isPaginationDisabled =
      query.$paginate === false || query.$paginate === 'false';

    // Create query builder
    const queryBuilder = this.repository.createQueryBuilder('entity');

    // Apply filters and conditions
    applyFiltersToQueryBuilder(queryBuilder, filters, query);
    // Apply nestify for relations, sorting, etc.
    nestify(queryBuilder, filters as NestifyFilters, options, true);

    // If pagination is disabled, just return the results
    if (isPaginationDisabled) {
      return await queryBuilder.getMany();
    }

    // With pagination, we need to get both the data and total count
    const limit = Number(filters.$limit) || options.defaultLimit;
    const skip = Number(filters.$skip) || options.defaultSkip;

    const [data, total] = await Promise.all([
      queryBuilder.skip(skip).take(limit).getMany(),
      queryBuilder.clone().skip(0).take(0).getCount(),
    ]);

    return {
      total,
      $limit: limit,
      $skip: skip,
      data,
    };
  }

  async _create(
    data: DeepPartial<T> | DeepPartial<T>[],
    needsMulti: boolean | undefined = undefined,
  ): Promise<T | T[]> {
    const multi = needsMulti !== undefined ? needsMulti : this.options.multi;

    if (multi) {
      if (!Array.isArray(data)) {
        throw new BadRequestException(
          'Bulk creation requires an array of objects.',
        );
      }

      // Create and save all entities
      const entities = this.repository.create(data);
      return await this.repository.save(entities);
    }

    if (Array.isArray(data)) {
      throw new BadRequestException(
        'Single creation expects a single object, not an array.',
      );
    }

    // Create single record
    const entity = this.repository.create(data);
    return await this.repository.save(entity);
  }

  async _patch(
    id: number | null,
    data: Partial<T>,
    query: Record<string, any> = {},
    patchOptions = {
      handleSoftDelete: true,
    },
  ): Promise<T | T[] | null> {
    if (!patchOptions.handleSoftDelete) {
      throw new BadRequestException(
        'patchOptions.handleSoftDelete not provided in _patch.',
      );
    }

    // Handle soft delete
    if (options.deleteKey && patchOptions.handleSoftDelete) {
      query[options.deleteKey] = false;
    }

    const filters = assignFilters({}, query, FILTERS, {});
    const isSingleUpdate = id !== null;

    if (isSingleUpdate) {
      // Update single record by ID
      await this.repository.update(id, data as object);

      // Get the updated record
      const queryBuilder = this.repository.createQueryBuilder('entity');
      queryBuilder.where('entity.id = :id', { id });

      // Apply any additional filters
      nestify(queryBuilder, filters as NestifyFilters, options, true);
      return await queryBuilder.getOne();
    } else {
      // Update multiple records based on query
      const whereConditions = this._createWhereConditions(query);
      await this.repository.update(
        whereConditions as FindOptionsWhere<T>,
        data as object,
      );

      // Return updated records
      const queryBuilder = this.repository.createQueryBuilder('entity');
      applyFiltersToQueryBuilder(queryBuilder, filters, query);
      return await queryBuilder.getMany();
    }
  }

  async _get(
    id: number,
    query: Record<string, any> = {},
    getOptions = {
      handleSoftDelete: true,
    },
  ): Promise<T | null> {
    if (!getOptions.handleSoftDelete) {
      throw new BadRequestException(
        'getOptions.handleSoftDelete not provided in _get.',
      );
    }

    // Handle soft delete
    if (options.deleteKey && getOptions.handleSoftDelete) {
      query[options.deleteKey] = false;
    }

    const filters = assignFilters({}, query, FILTERS, {});

    // Create query builder
    const queryBuilder = this.repository.createQueryBuilder('entity');
    queryBuilder.where('entity.id = :id', { id });

    // Apply any additional filters from the query
    const whereConditions = this._createWhereConditions(query);
    Object.keys(whereConditions).forEach((key) => {
      queryBuilder.andWhere(`entity.${key} = :${key}`, {
        [key]: whereConditions[key],
      });
    });

    // Apply nestify for relations, sorting, etc.
    nestify(queryBuilder, filters as NestifyFilters, options, true);

    return await queryBuilder.getOne();
  }

  async _remove(
    id: number | null,
    query: Record<string, any> = {},
    removeOptions = {
      handleSoftDelete: true,
    },
  ): Promise<T | T[]> {
    if (!removeOptions.handleSoftDelete) {
      throw new BadRequestException(
        'findOptions.handleSoftDelete not provided in _remove.',
      );
    }

    // Get data before deletion for return
    let dataToReturn: T | T[];

    if (id) {
      const result = await this._get(id, query);
      if (result === null) {
        throw new BadRequestException('Record not found.');
      }
      dataToReturn = result;

      // Handle actual deletion
      if (this.options.softDelete && options.deleteKey) {
        // Soft delete - update the delete flag
        await this.repository.update(id, {
          [options.deleteKey]: true,
        } as unknown as Partial<T>);
      } else {
        // Hard delete
        await this.repository.delete(id);
      }
    } else {
      // Get all records that match the query
      const whereConditions = this._createWhereConditions(query);
      dataToReturn = await this.repository.find({
        where: whereConditions as FindOptionsWhere<T>,
      });

      // Delete multiple records
      if (this.options.softDelete && options.deleteKey) {
        // Soft delete - update the delete flag
        await this.repository.update(
          whereConditions as FindOptionsWhere<T>,
          { [options.deleteKey]: true } as unknown as Partial<T>,
        );
      } else {
        // Hard delete
        await this.repository.delete(whereConditions as FindOptionsWhere<T>);
      }
    }

    return dataToReturn;
  }

  async getCount(filter: Record<string, any>): Promise<number> {
    if (options.deleteKey) {
      filter[options.deleteKey] = false;
    }

    return await this.repository.count({
      where: filter as FindOptionsWhere<T>,
    });
  }

  // Helper method to convert query object to TypeORM where conditions
  private _createWhereConditions(
    query: Record<string, any>,
  ): Record<string, any> {
    // Filter out special query parameters that start with $
    const whereConditions = Object.keys(query)
      .filter((key) => !key.startsWith('$'))
      .reduce((result, key) => {
        result[key] = query[key];
        return result;
      }, {});

    return whereConditions;
  }
}
