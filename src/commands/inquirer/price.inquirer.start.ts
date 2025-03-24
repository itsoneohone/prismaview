import { Question, QuestionSet } from 'nest-commander';
import { parseDate } from 'src/shared/utils/common';

export const QUESTIONS_START = 'questions-start';
@QuestionSet({ name: QUESTIONS_START })
export class StartDateQuestions {
  @Question({
    message: 'Enter a date in a valid date format (e.g., yyyy/mm/dd)',
    name: 'start',
    validate: (start: string): string | true => {
      if (!parseDate(start)) {
        return 'Enter a date using any valid date string format (e.g., yyyy/mm/dd).';
      }
      return true;
    },
  })
  parseTask(val: string): string {
    return val;
  }
}
