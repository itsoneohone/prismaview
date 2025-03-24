import { PaginateDto, PaginateResultDto } from 'src/shared/dto';

export const SEARCH_LIMIT = 20;

export function searchHasMoreData(
  count: number,
  limit: number,
  offset: number,
) {
  return count > limit + offset;
}

export const preparePaginateResultDto = (
  data: Record<string, any>[],
  count: number,
  paginate: PaginateDto,
): PaginateResultDto => {
  return {
    data,
    count,
    hasMore: count > paginate.offset + paginate.limit,
  };
};
