import { Question, QuestionSet } from 'nest-commander';

enum TASK_ENUM {
  FETCH_PRICES = 'fetch-prices',
}
export const QUESTIONS_TASK = 'questions-task';
@QuestionSet({ name: QUESTIONS_TASK })
export class TaskQuestions {
  @Question({
    message: 'What task would you like to execute?',
    choices: Object.values(TASK_ENUM),
    type: 'list',
    name: 'task',
    default: TASK_ENUM.FETCH_PRICES,
  })
  parseTask(val: string): string {
    return val;
  }
}
