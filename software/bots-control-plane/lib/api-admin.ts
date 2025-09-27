/**
 * Admin API helpers
 */

import type {
  MonitoringOverview,
  Subscription,
  Invoice,
  BotInstance,
  AffiliateInfo,
} from './api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export async function getMonitoringOverview(): Promise<MonitoringOverview> {
  const response = await fetch(`${API_BASE_URL}/api/monitoring/overview`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get monitoring overview: ${response.statusText}`);
  }

  return response.json();
}

export async function adminSubscriptions(
  status?: string, 
  limit = 50, 
  offset = 0
): Promise<Subscription[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/admin/subscriptions?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list subscriptions: ${response.statusText}`);
  }

  return response.json();
}

export async function adminInvoices(
  status?: string, 
  limit = 50, 
  offset = 0
): Promise<Invoice[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/admin/invoices?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list invoices: ${response.statusText}`);
  }

  return response.json();
}

export async function adminBots(
  status?: string, 
  limit = 50, 
  offset = 0
): Promise<BotInstance[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/admin/bots?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list bots: ${response.statusText}`);
  }

  return response.json();
}

export async function affiliateMe(): Promise<AffiliateInfo> {
  const response = await fetch(`${API_BASE_URL}/api/affiliate`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get affiliate info: ${response.statusText}`);
  }

  return response.json();
}

export async function adminAffiliates(
  limit = 50, 
  offset = 0
): Promise<any[]> {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());

  const response = await fetch(`${API_BASE_URL}/api/admin/affiliates?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list affiliates: ${response.statusText}`);
  }

  return response.json();
}