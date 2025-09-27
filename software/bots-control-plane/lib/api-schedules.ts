/**
 * Schedules API helpers
 */

import type { Schedule } from './api-types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function getAuthHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
  };
}

export async function listSchedules(
  botInstanceId?: string, 
  fromDate?: string, 
  toDate?: string
): Promise<Schedule[]> {
  const params = new URLSearchParams();
  if (botInstanceId) params.append('botInstanceId', botInstanceId);
  if (fromDate) params.append('from_date', fromDate);
  if (toDate) params.append('to_date', toDate);

  const response = await fetch(`${API_BASE_URL}/api/schedules?${params}`, {
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to list schedules: ${response.statusText}`);
  }

  return response.json();
}

export async function createSchedule(data: {
  bot_instance_id: string;
  kind: 'full' | 'phase';
  phase_id?: string;
  start_at: string;
  payload_json?: any;
}): Promise<Schedule> {
  const response = await fetch(`${API_BASE_URL}/api/schedules`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create schedule: ${response.statusText}`);
  }

  return response.json();
}

export async function updateSchedule(scheduleId: string, data: {
  start_at?: string;
  payload_json?: any;
}): Promise<Schedule> {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to update schedule: ${response.statusText}`);
  }

  return response.json();
}

export async function deleteSchedule(scheduleId: string): Promise<{ok: boolean}> {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to delete schedule: ${response.statusText}`);
  }

  return response.json();
}

export async function copyDay(data: {
  bot_instance_id: string;
  from_date: string;
  to_date: string;
}): Promise<{copied_count: number, skipped_count: number}> {
  const response = await fetch(`${API_BASE_URL}/api/schedules/copy-day`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to copy day: ${response.statusText}`);
  }

  return response.json();
}