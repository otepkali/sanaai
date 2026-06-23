import { createClient } from "./client";

export type CalculationType = "fot" | "simplified" | "vat" | "comparison";

export interface CalculationRow {
  id: string;
  user_id: string;
  type: CalculationType;
  title: string | null;
  input: unknown;
  result: unknown;
  created_at: string;
}

export async function listCalculations(): Promise<CalculationRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("calculations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteCalculation(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("calculations").delete().eq("id", id);
  if (error) throw error;
}

export interface UpsertCalculationParams {
  /** id существующей строки для обновления, или null чтобы создать новую */
  id: string | null;
  userId: string;
  type: CalculationType;
  title: string;
  input: unknown;
  result: unknown;
}

/** Возвращает id сохранённой строки (новый или тот же, что был передан) */
export async function upsertCalculation(params: UpsertCalculationParams): Promise<string | null> {
  const supabase = createClient();
  const payload = {
    user_id: params.userId,
    type: params.type,
    title: params.title,
    input: params.input,
    result: params.result,
  };

  if (params.id) {
    const { error } = await supabase.from("calculations").update(payload).eq("id", params.id);
    if (error) throw error;
    return params.id;
  }

  const { data, error } = await supabase
    .from("calculations")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  return data?.id ?? null;
}
