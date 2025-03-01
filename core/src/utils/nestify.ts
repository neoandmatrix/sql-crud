import { SelectQueryBuilder, ObjectLiteral } from 'typeorm';

export interface NestifyFilters {
  $select?: string[] | string | Record<string, any>;
  $relations?: string[] | string;
  $sort?: Record<string, 'ASC' | 'DESC'>;
  $limit?: number;
  $skip?: number;
  [key: string]: any;
}

export interface NestifyOptions {
  defaultLimit: number;
  defaultSkip: number;
  defaultPagination: boolean;
}

export function nestify<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  filters: NestifyFilters,
  options: NestifyOptions,
  isSingleOperation: boolean = false,
  isPaginationDisabled: boolean = false,
): void {
  // Handle select fields
  if (Array.isArray(filters.$select)) {
    const selectFields = filters.$select.map(
      (field) => `${queryBuilder.alias}.${field}`,
    );
    queryBuilder.select(selectFields);
  } else if (typeof filters.$select === 'string') {
    queryBuilder.select([`${queryBuilder.alias}.${filters.$select}`]);
  } else if (typeof filters.$select === 'object' && filters.$select !== null) {
    // Convert object format to array of fields
    const selectObject = filters.$select; // Create a local variable
    const selectFields = Object.keys(selectObject)
      .filter((key) => selectObject[key])
      .map((field) => `${queryBuilder.alias}.${field}`);

    if (selectFields.length) {
      queryBuilder.select(selectFields);
    }
  }

  // Handle relations (equivalent to MongoDB's populate)
  if (filters.$relations && options.defaultPagination) {
    if (Array.isArray(filters.$relations)) {
      filters.$relations.forEach((relation) => {
        queryBuilder.leftJoinAndSelect(
          `${queryBuilder.alias}.${relation}`,
          relation,
        );
      });
    } else if (typeof filters.$relations === 'string') {
      queryBuilder.leftJoinAndSelect(
        `${queryBuilder.alias}.${filters.$relations}`,
        filters.$relations,
      );
    }
  }

  // Handle sorting
  if (filters.$sort) {
    const sortOptions = filters.$sort;
    Object.keys(sortOptions).forEach((key) => {
      queryBuilder.addOrderBy(`${queryBuilder.alias}.${key}`, sortOptions[key]);
    });
  }

  // Handle pagination
  if (!isPaginationDisabled && !isSingleOperation) {
    const limit = Number(filters.$limit) || options.defaultLimit;
    if (limit > 0) {
      queryBuilder.take(limit);
    }

    const skip = Number(filters.$skip) || options.defaultSkip;
    if (skip > 0) {
      queryBuilder.skip(skip);
    }
  }
}
