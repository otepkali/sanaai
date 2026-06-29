import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./client";
import type {
  CompanyRequisites,
  CompanyAddress,
  CompanyAddressType,
  CompanyBankAccount,
  CompanyWarehouse,
  CompanyCashRegister,
  CompanySigner,
  CompanySignerRole,
} from "@/lib/documents/types";

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
  regime: string;
  kbe: string;
  is_vat_payer: boolean;
  single_payment_status: string;
  logo_path: string | null;
  owner_full_name: string;
  residency_country: string;
  owner_monthly_income: number | null;
  owner_statuses: string;
  tax_authority_registration: string;
  tax_authority_residence: string;
  akimat_bin: string;
  registration_certificate_number: string;
  registration_certificate_date: string | null;
  currency: string;
  stock_control_enabled: boolean;
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
    regime: row.regime,
    kbe: row.kbe,
    isVatPayer: row.is_vat_payer,
    singlePaymentStatus: row.single_payment_status,
    logoPath: row.logo_path,
    ownerFullName: row.owner_full_name,
    residencyCountry: row.residency_country,
    ownerMonthlyIncome: row.owner_monthly_income,
    ownerStatuses: row.owner_statuses,
    taxAuthorityRegistration: row.tax_authority_registration,
    taxAuthorityResidence: row.tax_authority_residence,
    akimatBin: row.akimat_bin,
    registrationCertificateNumber: row.registration_certificate_number,
    registrationCertificateDate: row.registration_certificate_date,
    currency: row.currency,
    stockControlEnabled: row.stock_control_enabled,
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
    regime: requisites.regime,
    kbe: requisites.kbe,
    is_vat_payer: requisites.isVatPayer,
    single_payment_status: requisites.singlePaymentStatus,
    logo_path: requisites.logoPath,
    owner_full_name: requisites.ownerFullName,
    residency_country: requisites.residencyCountry,
    owner_monthly_income: requisites.ownerMonthlyIncome,
    owner_statuses: requisites.ownerStatuses,
    tax_authority_registration: requisites.taxAuthorityRegistration,
    tax_authority_residence: requisites.taxAuthorityResidence,
    akimat_bin: requisites.akimatBin,
    registration_certificate_number: requisites.registrationCertificateNumber,
    registration_certificate_date: requisites.registrationCertificateDate,
    currency: requisites.currency,
    stock_control_enabled: requisites.stockControlEnabled,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Загружает PNG подписи/печати/логотипа в приватный бакет, путь {userId}/{kind}.png или {userId}/signers/{signerId}.png */
export async function uploadCompanyFile(
  userId: string,
  kind: "signature" | "stamp" | "logo",
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

export async function uploadSignerFile(userId: string, signerId: string, file: File): Promise<string> {
  const supabase = createClient();
  const path = `${userId}/signers/${signerId}.png`;
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

// ---------- Адреса ----------

interface AddressRow {
  id: string;
  type: CompanyAddressType;
  address: string;
  sort_order: number;
}

function rowToAddress(row: AddressRow): CompanyAddress {
  return { id: row.id, type: row.type, address: row.address, sortOrder: row.sort_order };
}

export async function getAddresses(): Promise<CompanyAddress[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("company_addresses").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(rowToAddress);
}

export async function upsertAddress(
  userId: string,
  address: Pick<CompanyAddress, "type" | "address" | "sortOrder"> & { id?: string }
): Promise<CompanyAddress> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_addresses")
    .upsert({
      id: address.id,
      user_id: userId,
      type: address.type,
      address: address.address,
      sort_order: address.sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToAddress(data);
}

export async function deleteAddress(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("company_addresses").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Расчётные счета (дополнительные, помимо основного) ----------

interface BankAccountRow {
  id: string;
  label: string;
  account_number: string;
  currency: string;
  bik: string;
  bank_name: string;
  sort_order: number;
}

function rowToBankAccount(row: BankAccountRow): CompanyBankAccount {
  return {
    id: row.id,
    label: row.label,
    accountNumber: row.account_number,
    currency: row.currency,
    bik: row.bik,
    bankName: row.bank_name,
    sortOrder: row.sort_order,
  };
}

export async function getBankAccounts(): Promise<CompanyBankAccount[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("company_bank_accounts").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(rowToBankAccount);
}

export async function upsertBankAccount(
  userId: string,
  account: Omit<CompanyBankAccount, "id"> & { id?: string }
): Promise<CompanyBankAccount> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_bank_accounts")
    .upsert({
      id: account.id,
      user_id: userId,
      label: account.label,
      account_number: account.accountNumber,
      currency: account.currency,
      bik: account.bik,
      bank_name: account.bankName,
      sort_order: account.sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToBankAccount(data);
}

export async function deleteBankAccount(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("company_bank_accounts").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Склады ----------

interface WarehouseRow {
  id: string;
  name: string;
  address: string;
  sort_order: number;
}

function rowToWarehouse(row: WarehouseRow): CompanyWarehouse {
  return { id: row.id, name: row.name, address: row.address, sortOrder: row.sort_order };
}

export async function getWarehouses(): Promise<CompanyWarehouse[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("company_warehouses").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(rowToWarehouse);
}

export async function upsertWarehouse(
  userId: string,
  warehouse: Omit<CompanyWarehouse, "id"> & { id?: string }
): Promise<CompanyWarehouse> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_warehouses")
    .upsert({
      id: warehouse.id,
      user_id: userId,
      name: warehouse.name,
      address: warehouse.address,
      sort_order: warehouse.sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToWarehouse(data);
}

export async function deleteWarehouse(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("company_warehouses").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Кассы ----------

interface CashRegisterRow {
  id: string;
  name: string;
  cashier_name: string;
  address: string;
  sort_order: number;
}

function rowToCashRegister(row: CashRegisterRow): CompanyCashRegister {
  return { id: row.id, name: row.name, cashierName: row.cashier_name, address: row.address, sortOrder: row.sort_order };
}

export async function getCashRegisters(): Promise<CompanyCashRegister[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("company_cash_registers").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(rowToCashRegister);
}

export async function upsertCashRegister(
  userId: string,
  register: Omit<CompanyCashRegister, "id"> & { id?: string }
): Promise<CompanyCashRegister> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_cash_registers")
    .upsert({
      id: register.id,
      user_id: userId,
      name: register.name,
      cashier_name: register.cashierName,
      address: register.address,
      sort_order: register.sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToCashRegister(data);
}

export async function deleteCashRegister(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("company_cash_registers").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Подписанты ----------

interface SignerRow {
  id: string;
  role: CompanySignerRole;
  full_name: string;
  signature_path: string | null;
  sort_order: number;
}

function rowToSigner(row: SignerRow): CompanySigner {
  return {
    id: row.id,
    role: row.role,
    fullName: row.full_name,
    signaturePath: row.signature_path,
    sortOrder: row.sort_order,
  };
}

export async function getSigners(): Promise<CompanySigner[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("company_signers").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(rowToSigner);
}

export async function upsertSigner(
  userId: string,
  signer: Omit<CompanySigner, "id"> & { id?: string }
): Promise<CompanySigner> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("company_signers")
    .upsert({
      id: signer.id,
      user_id: userId,
      role: signer.role,
      full_name: signer.fullName,
      signature_path: signer.signaturePath,
      sort_order: signer.sortOrder,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToSigner(data);
}

export async function deleteSigner(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("company_signers").delete().eq("id", id);
  if (error) throw error;
}
