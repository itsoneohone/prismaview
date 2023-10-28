import { PaginateDto, PaginateResultDto } from 'src/common/dto';

export const SEARCH_LIMIT = 20;

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
