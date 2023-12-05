import { Injectable } from '@nestjs/common';

@Injectable()
export class SimpleService {
  testMe(value: number): number {
    return value + 1;
  }

  genRandom() {
    return Math.round(Math.random() * 100);
  }

  testMeWithMocks(value: number): number {
    const randomValue = this.genRandom();
    return randomValue + value;
  }
}
