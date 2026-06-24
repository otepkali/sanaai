import Anthropic from "@anthropic-ai/sdk";
import { ACCOUNTING_SYSTEM_PROMPT } from "./system-prompt";
import { accountingAnalysisSchema } from "./schema";
import type { AccountingAnalysisResult } from "./types";

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 8192;

export class AccountingAnalysisError extends Error {}

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenceMatch ? fenceMatch[1].trim() : trimmed;
}

async function requestAnalysis(
  client: Anthropic,
  userMessage: string,
  retry: boolean
): Promise<unknown> {
  const content = retry
    ? `${userMessage}\n\nВАЖНО: верни ТОЛЬКО валидный JSON-объект без markdown-обёртки (без \`\`\`), без пояснений до или после JSON.`
    : userMessage;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: ACCOUNTING_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const rawText = textBlock?.type === "text" ? textBlock.text : "";
  const cleaned = stripMarkdownFences(rawText);

  return JSON.parse(cleaned);
}

export interface AnalyzeAccountingDocumentParams {
  period: string;
  documentTypeLabel: string;
  extractedText: string;
}

export async function analyzeAccountingDocument({
  period,
  documentTypeLabel,
  extractedText,
}: AnalyzeAccountingDocumentParams): Promise<AccountingAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AccountingAnalysisError("ANTHROPIC_API_KEY не настроен на сервере");
  }

  const client = new Anthropic({ apiKey });
  const userMessage = `Период: ${period}\nТип документа: ${documentTypeLabel}\n\nСодержимое документа:\n${extractedText}`;

  let parsedJson: unknown;
  try {
    parsedJson = await requestAnalysis(client, userMessage, false);
  } catch (firstError) {
    if (firstError instanceof Anthropic.APIError) {
      throw new AccountingAnalysisError(`Не удалось связаться с ИИ: ${firstError.message}`);
    }
    try {
      parsedJson = await requestAnalysis(client, userMessage, true);
    } catch (secondError) {
      if (secondError instanceof Anthropic.APIError) {
        throw new AccountingAnalysisError(`Не удалось связаться с ИИ: ${secondError.message}`);
      }
      throw new AccountingAnalysisError("ИИ вернул ответ в неожиданном формате. Попробуйте повторить анализ.");
    }
  }

  const validation = accountingAnalysisSchema.safeParse(parsedJson);
  if (!validation.success) {
    throw new AccountingAnalysisError("ИИ вернул данные в неожиданном формате. Попробуйте повторить анализ.");
  }

  return validation.data;
}
