import { PaginateDto, PaginateResultDto } from 'src/common/dto';

export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

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
