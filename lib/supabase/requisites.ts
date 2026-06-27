import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type { CompanyRequisites } from "@/lib/documents/types";

const BUCKET = "company-files";

interface RequisitesRow {
  user_id: string;
  company_name: string;
  bin_iin: string;
  is_individual_entrepreneur: boolean;
  director_name: string;
  accountant_name: string;
  address: string;
  bank_name: string;
  iik: string;
  bik: string;
  signature_path: string | null;
  stamp_path: string | null;
}

function rowToRequisites(row: RequisitesRow): CompanyRequisites {
  return {
    companyName: row.company_name,
    binIin: row.bin_iin,
    isIndividualEntrepreneur: row.is_individual_entrepreneur,
    directorName: row.director_name,
    accountantName: row.accountant_name,
    address: row.address,
    bankName: row.bank_name,
    iik: row.iik,
    bik: row.bik,
    signaturePath: row.signature_path,
    stampPath: row.stamp_path,
  };
}

export async function getRequisites(): Promise<CompanyRequisites | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("company_requisites").select("*").maybeSingle();
  if (error) throw error;
  return data ? rowToRequisites(data) : null;
}

export async function upsertRequisites(userId: string, requisites: CompanyRequisites): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("company_requisites").upsert({
    user_id: userId,
    company_name: requisites.companyName,
    bin_iin: requisites.binIin,
    is_individual_entrepreneur: requisites.isIndividualEntrepreneur,
    director_name: requisites.directorName,
    accountant_name: requisites.accountantName,
    address: requisites.address,
    bank_name: requisites.bankName,
    iik: requisites.iik,
    bik: requisites.bik,
    signature_path: requisites.signaturePath,
    stamp_path: requisites.stampPath,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Загружает PNG подписи/печати в приватный бакет, путь {userId}/{kind}.png */
export async function uploadCompanyFile(
  userId: string,
  kind: "signature" | "stamp",
  file: File
): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/${kind}.png`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: true,
    contentType: file.type || "image/png",
  });
  if (error) throw error;
  return path;
}

export async function getCompanyFileSignedUrl(path: string): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 10);
  if (error) {
    console.error("Не удалось получить ссылку на файл", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

/** Для использования в Route Handlers — принимает уже созданный серверный клиент (см. lib/supabase/server.ts) */
export async function getRequisitesServer(
  supabase: SupabaseClient
): Promise<CompanyRequisites | null> {
  const { data, error } = await supabase.from("company_requisites").select("*").maybeSingle();
  if (error) throw error;
  return data ? rowToRequisites(data as RequisitesRow) : null;
}

/** Скачивает файл подписи/печати как Buffer — для встраивания в PDF на сервере */
export async function downloadCompanyFileServer(
  supabase: SupabaseClient,
  path: string
): Promise<Buffer | null> {
  const { data, error } = await supabase.storage.from(BUCKET).download(path);
  if (error || !data) {
    console.error("Не удалось скачать файл подписи/печати", error);
    return null;
  }
  return Buffer.from(await data.arrayBuffer());
}
