import { ExchangeNameEnum } from '@prisma/client';
import { Question, QuestionSet } from 'nest-commander';

export const QUESTIONS_EXCHANGE = 'questions-exchange';
@QuestionSet({ name: QUESTIONS_EXCHANGE })
export class ExchangeQuestions {
  @Question({
    choices: Object.values(ExchangeNameEnum),
    type: 'list',
    message: 'Which exchange do you want to use?',
    name: 'exchange',
  })
  parseExchange(val: string): string {
    return val;
  }
}
