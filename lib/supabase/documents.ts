import { createClient } from "./client";
import type { DocumentType } from "@/lib/documents/types";

export interface DocumentRow {
  id: string;
  user_id: string;
  type: DocumentType;
  title: string | null;
  data: unknown;
  created_at: string;
}

export async function listDocuments(): Promise<DocumentRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("accounting_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function deleteDocument(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("accounting_documents").delete().eq("id", id);
  if (error) throw error;
}

export interface SaveDocumentParams {
  userId: string;
  type: DocumentType;
  title: string;
  data: unknown;
}

export async function saveDocument({ userId, type, title, data }: SaveDocumentParams): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("accounting_documents")
    .insert({ user_id: userId, type, title, data });
  if (error) throw error;
}
