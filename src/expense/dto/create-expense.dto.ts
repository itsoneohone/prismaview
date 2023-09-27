export interface CreateExpenseDto {
  title: string;
  description?: string;
  amount: string;
  date: Date;
}
