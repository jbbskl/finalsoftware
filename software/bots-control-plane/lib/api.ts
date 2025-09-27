/**
 * Client-side API helpers for all endpoints
 */

import type {
  InvoiceRequest,
  InvoiceResponse,
  BotInstance,
  Run,
  MonitoringOverview,
  Phase,
  Schedule,
  Subscription,
  Invoice,
  AffiliateInfo,
} from './api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${token}`,
  };
}

// Billing API
export async function createInvoice(data: InvoiceRequest): Promise<InvoiceResponse> {
  const response = await fetch(`${API_BASE_URL}/api/billing/invoice`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create invoice: ${response.statusText}`);
  }

  return response.json();
}

export async function getInvoice(invoiceId: string): Promise<Invoice> {
  const response = await fetch(`${API_BASE_URL}/api/billing/invoices/${invoiceId}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get invoice: ${response.statusText}`);
  }

  return response.json();
}

export async function postStripeWebhookDev(invoiceId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/billing/webhook/stripe`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      invoice_id: invoiceId,
      event: 'paid'
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark invoice as paid: ${response.statusText}`);
  }
}

export async function postCryptoWebhookDev(invoiceId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/billing/webhook/crypto`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      invoice_id: invoiceId,
      event: 'confirmed'
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to mark invoice as paid: ${response.statusText}`);
  }
}

// Bot Instances API
export async function uploadCookies(botInstanceId: string, file: File): Promise<{ok: boolean}> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/upload-cookies`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload cookies: ${response.statusText}`);
  }

  return response.json();
}

export async function validateBot(botInstanceId: string): Promise<{ok: boolean}> {
  const response = await fetch(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/validate`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to validate bot: ${response.statusText}`);
  }

  return response.json();
}

export async function startRun(botInstanceId: string): Promise<{run_id: string, status: string}> {
  const response = await fetch(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/start`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to start run: ${response.statusText}`);
  }

  return response.json();
}

export async function stopRun(botInstanceId: string): Promise<{ok: boolean}> {
  const response = await fetch(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/stop`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to stop run: ${response.statusText}`);
  }

  return response.json();
}

export function streamLogsSSE(botInstanceId: string): EventSource {
  return new EventSource(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/logs/stream`);
}

export async function listRuns(botInstanceId?: string, limit = 50, offset = 0): Promise<Run[]> {
  const params = new URLSearchParams();
  if (botInstanceId) params.append('botInstanceId', botInstanceId);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/runs?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list runs: ${response.statusText}`);
  }

  return response.json();
}