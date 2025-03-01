/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException } from '@nestjs/common';
import _ from 'lodash';
import { SelectQueryBuilder } from 'typeorm';

export const FILTERS = {
  $sort: (value) => convertSort(value),
  $limit: (value, options) => getLimit(parse(value), options?.paginate),
  $skip: (value) => parse(value),
  $select: (value) => value,
  $relations: (value) => value, // TypeORM uses relations instead of populate
};

export function parse(number?: any) {
  if (typeof number !== 'undefined') {
    return Math.abs(parseInt(number, 10));
  }

  return undefined;
}

function getLimit(limit, paginate) {
  if (paginate && paginate.default) {
    const lower =
      typeof limit === 'number' && !isNaN(limit) ? limit : paginate.default;
    const upper =
      typeof paginate.max === 'number' ? paginate.max : Number.MAX_VALUE;

    return Math.min(lower, upper);
  }

  return limit;
}

export const applyQuery = (
  queryBuilder: SelectQueryBuilder<any>,
  query: any,
) => {
  for (const key in query) {
    if (Object.prototype.hasOwnProperty.call(query, key)) {
      if (key.startsWith('$')) {
        const filterKey = key.slice(1);
        if (filterKey === 'regex') {
          const field = Object.keys(query[key])[0];
          const regexPattern = query[key][field];
          // SQL LIKE equivalent of MongoDB regex
          queryBuilder.andWhere(`${field} LIKE :${field}Pattern`, {
            [`${field}Pattern`]: `%${regexPattern}%`,
          });
        } else if (filterKey === 'or' && Array.isArray(query[key])) {
          query[key].forEach((orClause, index) => {
            const orParams = {};
            const orConditions = Object.keys(orClause).map((orKey) => {
              const paramName = `${orKey}_${index}`;
              orParams[paramName] = orClause[orKey];
              return `${orKey} = :${paramName}`;
            });
            queryBuilder.orWhere(`(${orConditions.join(' AND ')})`, orParams);
          });
        }
      } else {
        // Handle normal field queries
        if (typeof query[key] === 'object' && !Array.isArray(query[key])) {
          // Handle operator queries like $gt, $lt, etc.
          Object.keys(query[key]).forEach((operator) => {
            const value = query[key][operator];
            switch (operator) {
              case '$in':
                queryBuilder.andWhere(`${key} IN (:...${key})`, {
                  [key]: value,
                });
                break;
              case '$nin':
                queryBuilder.andWhere(`${key} NOT IN (:...${key})`, {
                  [key]: value,
                });
                break;
              case '$lt':
                queryBuilder.andWhere(`${key} < :${key}_lt`, {
                  [`${key}_lt`]: value,
                });
                break;
              case '$lte':
                queryBuilder.andWhere(`${key} <= :${key}_lte`, {
                  [`${key}_lte`]: value,
                });
                break;
              case '$gt':
                queryBuilder.andWhere(`${key} > :${key}_gt`, {
                  [`${key}_gt`]: value,
                });
                break;
              case '$gte':
                queryBuilder.andWhere(`${key} >= :${key}_gte`, {
                  [`${key}_gte`]: value,
                });
                break;
              case '$ne':
                queryBuilder.andWhere(`${key} != :${key}_ne`, {
                  [`${key}_ne`]: value,
                });
                break;
            }
          });
        } else {
          // Simple equality
          queryBuilder.andWhere(`${key} = :${key}`, { [key]: query[key] });
        }
      }
    }
  }

  return queryBuilder;
};

function convertSort(sort) {
  if (typeof sort !== 'object' || Array.isArray(sort)) {
    return sort;
  }

  // Convert sort object to TypeORM format
  // TypeORM uses { field: 'ASC' | 'DESC' } instead of { field: 1 | -1 }
  return Object.keys(sort).reduce((result, key) => {
    const direction =
      typeof sort[key] === 'object' ? sort[key] : parseInt(sort[key], 10);

    result[key] = direction === -1 || direction === '-1' ? 'DESC' : 'ASC';
    return result;
  }, {});
}

export const OPERATORS = [
  '$in',
  '$nin',
  '$lt',
  '$lte',
  '$gt',
  '$gte',
  '$ne',
  '$or',
];

export const filterQuery = (query, options = {}) => {
  const {
    // @ts-expect-error something is wrong with the types
    filters: additionalFilters = {},
    // @ts-expect-error something is wrong with the types
    operators: additionalOperators = [],
  } = options;

  const result = {
    filters: {},
    query: {},
  };

  result.filters = assignFilters({}, query, FILTERS, options);
  result.filters = assignFilters(
    result.filters,
    query,
    additionalFilters,
    options,
  );
  result.query = cleanQuery(
    query,
    OPERATORS.concat(additionalOperators),
    result.filters,
  );

  return result;
};

export const assignFilters = (object, query, filters, options) => {
  if (Array.isArray(filters)) {
    _.forEach(filters, (key) => {
      if (query[key] !== undefined) {
        object[key] = query[key];
      }
    });
  } else {
    _.forEach(filters, (converter, key) => {
      const converted = converter(query[key], options);
      if (converted !== undefined) {
        object[key] = converted;
      }
    });
  }
  return object;
};

export const cleanQuery = (query, operators, filters) => {
  if (Array.isArray(query)) {
    return query.map((value) => cleanQuery(value, operators, filters));
  } else if (_.isPlainObject(query)) {
    const result = {};

    _.forEach(query, (value, key) => {
      if (key.startsWith('$')) {
        if (filters[key] === undefined && !operators.includes(key)) {
          throw new BadRequestException(
            `Invalid query parameter: ${key}`,
            query,
          );
        }
      }
      result[key] = cleanQuery(value, operators, filters);
    });

    Object.getOwnPropertySymbols(query).forEach((symbol) => {
      result[symbol] = query[symbol];
    });

    return result;
  }

  return query;
};

// Helper function to apply filters to a TypeORM QueryBuilder
export const applyFiltersToQueryBuilder = (
  queryBuilder: SelectQueryBuilder<any>,
  filters: any,
  query: any,
) => {
  // Apply pagination
  if (filters.$skip !== undefined) {
    queryBuilder.skip(filters.$skip);
  }

  if (filters.$limit !== undefined) {
    queryBuilder.take(filters.$limit);
  }

  // Apply sorting
  if (filters.$sort) {
    Object.keys(filters.$sort).forEach((key) => {
      queryBuilder.addOrderBy(key, filters.$sort[key]);
    });
  }

  // Apply select
  if (filters.$select) {
    queryBuilder.select(filters.$select);
  }

  // Apply relations
  if (filters.$relations) {
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

  // Apply the actual query conditions
  applyQuery(queryBuilder, query);

  return queryBuilder;
};
