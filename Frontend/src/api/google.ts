import { apiRequest } from './client'

export interface GoogleStatus { connected: boolean; calendar: boolean; gmail: boolean }

export function getGoogleStatus(): Promise<GoogleStatus> { return apiRequest<GoogleStatus>('/google/status') }
export function connectGoogle(): Promise<{ redirect_url: string }> { return apiRequest('/google/authorize', { method: 'POST' }) }
export function disconnectGoogle(): Promise<{ message: string }> { return apiRequest('/google/connection', { method: 'DELETE' }) }
