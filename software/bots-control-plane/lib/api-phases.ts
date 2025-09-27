/**
 * Phases API helpers
 */

import type { Phase } from './api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export async function listPhases(botInstanceId: string): Promise<Phase[]> {
  const response = await fetch(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/phases`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list phases: ${response.statusText}`);
  }

  return response.json();
}

export async function createPhase(botInstanceId: string, data: {
  name: string;
  order_no: number;
  config_json: any;
}): Promise<Phase> {
  const response = await fetch(`${API_BASE_URL}/api/bot-instances/${botInstanceId}/phases`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create phase: ${response.statusText}`);
  }

  return response.json();
}

export async function updatePhase(phaseId: string, data: {
  name?: string;
  order_no?: number;
  config_json?: any;
}): Promise<Phase> {
  const response = await fetch(`${API_BASE_URL}/api/phases/${phaseId}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update phase: ${response.statusText}`);
  }

  return response.json();
}

export async function deletePhase(phaseId: string): Promise<{ok: boolean}> {
  const response = await fetch(`${API_BASE_URL}/api/phases/${phaseId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete phase: ${response.statusText}`);
  }

  return response.json();
}