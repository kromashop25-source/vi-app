import { z } from "zod";

export const OISchema = z.object({
  oi: z.string().regex(/^OI-\d{4}-\d{4}$/, "Formato OI-####-YYYY"),
  q3: z.number(),
  alcance: z.number(),
  pma: z.number().refine((v) => v === 10 || v === 16, { message: "PMA inválido" }),
  estado: z.number().int().min(0).max(5).default(0),
});

export type OIForm = z.infer<typeof OISchema>;
export type OIFormInput = z.input<typeof OISchema>;
export const bancadaFormSchema = z.object({
  medidor: z.string().optional(),
  estado: z.number().int().min(0),
  rows: z.number().int().min(1).default(15),
});
export type BancadaForm = z.infer<typeof bancadaFormSchema>;

export function pressureFromPMA(pma?: number): number {
  if (pma === 16) return 25.6;
  if (pma === 10) return 16.0;
  return NaN;
}