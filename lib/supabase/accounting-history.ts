import { createClient } from "./client";
import type { AccountingAnalysisResult } from "@/lib/accounting/types";

export interface SaveAccountingAnalysisParams {
  userId: string;
  result: AccountingAnalysisResult;
}

export async function saveAccountingAnalysis({
  userId,
  result,
}: SaveAccountingAnalysisParams): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("accounting_history").insert({
    user_id: userId,
    period: result.period,
    document_type: result.documentType,
    summary: result.summary,
    categories: result.categories,
    anomalies: result.anomalies,
  });

  if (error) throw error;
}
