import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("Вкажіть коректний email"),
  password: z.string().min(6, "Пароль має містити мінімум 6 символів"),
});

export const createWorkSchema = z.object({
  workDate: z.string().min(1, "Оберіть дату"),
  description: z.string().min(3, "Опис має містити мінімум 3 символи"),
  categoryId: z.string().min(1, "Оберіть категорію"),
  amount: z.coerce.number().min(0, "Сума не може бути від'ємною").optional(),
});

export const categorySchema = z.object({
  name: z.string().min(2, "Назва має містити мінімум 2 символи"),
});

export const amountSchema = z.object({
  amount: z.coerce.number().min(0, "Сума не може бути від'ємною"),
});

export const salaryPayoutSchema = z.object({
  payoutDate: z.string().min(1, "Оберіть дату"),
  description: z.string().min(3, "Опис має містити мінімум 3 символи"),
  amount: z.coerce.number().positive("Сума має бути більшою за 0"),
});
