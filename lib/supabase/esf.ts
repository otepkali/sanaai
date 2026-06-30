import { createClient } from "./client";
import type { EsfData } from "@/lib/esf/types";

export type EsfDocumentStatus = "draft" | "signed" | "sent" | "error";

export interface EsfDocumentRow {
  id: string;
  user_id: string;
  document_number: string;
  document_date: string;
  buyer_bin: string | null;
  buyer_name: string | null;
  buyer_email: string | null;
  total_sum: number | null;
  total_nds: number | null;
  total_with_nds: number | null;
  items: unknown;
  data: EsfData | null;
  xml_content: string | null;
  signed_xml: string | null;
  status: EsfDocumentStatus;
  esf_id: string | null;
  error_message: string | null;
  created_at: string;
  sent_at: string | null;
}

export async function listEsfDocuments(): Promise<EsfDocumentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("esf_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function deleteEsfDocument(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("esf_documents").delete().eq("id", id);
  if (error) throw error;
}

export async function saveEsfDraft(
  userId: string,
  data: EsfData,
  buyerEmail: string,
  xmlContent: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("esf_documents").insert({
    user_id: userId,
    document_number: data.sectionA.accountingSystemNumber,
    document_date: data.sectionA.issueDate,
    buyer_bin: data.sectionC.binIin,
    buyer_name: data.sectionC.name,
    buyer_email: buyerEmail,
    total_sum: data.totalSum,
    total_nds: data.totalVat,
    total_with_nds: data.totalSumWithTax,
    items: data.items,
    data,
    xml_content: xmlContent,
    status: "draft",
  });
  if (error) throw error;
}

// ---------- Контрагенты (покупатели) ----------

export interface EsfCounterparty {
  id: string;
  binIin: string;
  name: string;
  address: string;
  email: string;
}

interface CounterpartyRow {
  id: string;
  bin_iin: string;
  name: string;
  address: string;
  email: string;
}

function rowToCounterparty(row: CounterpartyRow): EsfCounterparty {
  return { id: row.id, binIin: row.bin_iin, name: row.name, address: row.address, email: row.email };
}

export async function searchCounterparties(query: string): Promise<EsfCounterparty[]> {
  if (!query.trim()) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("esf_counterparties")
    .select("*")
    .or(`bin_iin.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10);
  if (error) throw error;
  return (data ?? []).map(rowToCounterparty);
}

export async function saveCounterparty(
  userId: string,
  counterparty: Omit<EsfCounterparty, "id">
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("esf_counterparties").upsert(
    {
      user_id: userId,
      bin_iin: counterparty.binIin,
      name: counterparty.name,
      address: counterparty.address,
      email: counterparty.email,
    },
    { onConflict: "user_id,bin_iin" }
  );
  if (error) throw error;
}
