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

const QBlockSchema = z.object({
  c1: z.number().optional().nullable(),
  c2: z.number().optional().nullable(),
  c3: z.number().optional().nullable(),
  c4: z.number().optional().nullable(),
  c5: z.number().optional().nullable(),
  c6: z.number().optional().nullable(),
  c7: z.number().optional().nullable(),
});

export const BancadaRowSchema = z.object({
  medidor: z.string().optional(),
  q3: QBlockSchema.optional(),
  q2: QBlockSchema.optional(),
  q1: QBlockSchema.optional(),
});

export type BancadaRowForm = z.infer<typeof BancadaRowSchema>;

export const bancadaFormSchema = z.object({
  estado: z.number().int().min(0),
  rows: z.number().int().min(1).default(15),
  rowsData: z.array(BancadaRowSchema),
});
export type BancadaForm = z.infer<typeof bancadaFormSchema>;

export function pressureFromPMA(pma?: number): number {
  if (pma === 16) return 25.6;
  if (pma === 10) return 16.0;
  return NaN;
}