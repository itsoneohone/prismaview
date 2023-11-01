import { PaginateDto } from 'src/common/dto';
import { preparePaginateResultDto } from 'src/common/search-utils';

describe('preparePaginateResultDto()', () => {
  const paginate: PaginateDto = {
    limit: 10,
    offset: 0,
  };
  const data = new Array(30).fill({ value: Math.random() * 100 });

  it('return a PaginateResultDto', () => {
    const paginateRes = preparePaginateResultDto(data, data.length, paginate);

    expect(Object.keys(paginateRes)).toEqual(['data', 'count', 'hasMore']);
    expect(paginateRes.data).toEqual(data);
    expect(paginateRes.count).toEqual(data.length);
    expect(paginateRes.hasMore).toBe(true);
  });

  it('should infer if it `hasMore` results', () => {
    // Change the offset to the 2nd page
    paginate.offset = 10;
    let paginateRes = preparePaginateResultDto(data, data.length, paginate);

    expect(paginateRes.hasMore).toBe(true);

    // Change the offset to the 3rd page
    paginate.offset = 20;
    paginateRes = preparePaginateResultDto(data, data.length, paginate);

    expect(paginateRes.hasMore).toBe(false);
  });
});
