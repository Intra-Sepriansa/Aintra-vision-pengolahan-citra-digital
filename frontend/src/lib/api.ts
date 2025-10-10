"use client";

import { toast } from "sonner";

import type { OperationId, OperationParamValues } from "@/lib/operations";
import type { JobStatus, ProcessingResult } from "@/store/use-processing-store";

const DEFAULT_BASE_URL = "http://localhost:8000";

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE_URL;
  }
  return DEFAULT_BASE_URL;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Permintaan gagal diproses");
  }
  return response.json() as Promise<T>;
}

export interface UploadResponse {
  image_id: string;
  filename: string;
  content_type: string;
  size: number;
}

export interface PreviewResponse {
  preview_url: string;
  metrics?: Record<string, number>;
}

export interface ProcessResponse {
  job_id: string;
  status: JobStatus;
  eta_ms?: number;
}

export interface JobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  result_url?: string | null;
  metrics?: Record<string, number>;
  error?: string | null;
}

export async function uploadImage(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${getBaseUrl()}/api/upload`, {
    method: "POST",
    body: formData,
  });

  return handleResponse<UploadResponse>(response);
}

export async function requestPreview(
  imageId: string,
  operation: OperationId,
  params: OperationParamValues,
): Promise<PreviewResponse> {
  const response = await fetch(`${getBaseUrl()}/api/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_id: imageId, operation, params }),
  });

  return handleResponse<PreviewResponse>(response);
}

export async function requestProcessing(
  imageId: string,
  operation: OperationId,
  params: OperationParamValues,
): Promise<ProcessResponse> {
  const response = await fetch(`${getBaseUrl()}/api/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_id: imageId, operation, params }),
  });

  return handleResponse<ProcessResponse>(response);
}

export async function fetchJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${getBaseUrl()}/api/jobs/${jobId}`);
  return handleResponse<JobStatusResponse>(response);
}

export function createProgressSocket(jobId: string): WebSocket | null {
  try {
    const baseUrl = getBaseUrl();
    const wsUrl = baseUrl.replace(/^http/, "ws");
    return new WebSocket(`${wsUrl}/api/progress/${jobId}`);
  } catch (error) {
    console.error("Failed to create websocket", error);
    toast.error("Tidak dapat tersambung ke progress WebSocket");
    return null;
  }
}

export async function downloadResult(jobId: string) {
  const response = await fetch(`${getBaseUrl()}/api/download/${jobId}`);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengunduh hasil");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `aintra-${jobId}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function mapResultFromStatus(
  status: JobStatusResponse,
): ProcessingResult | undefined {
  if (status.status !== "completed" || !status.result_url) {
    return undefined;
  }
  return {
    jobId: status.job_id,
    url: status.result_url,
    metrics: status.metrics,
    completedAt: Date.now(),
  } satisfies ProcessingResult;
}
