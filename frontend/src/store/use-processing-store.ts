"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  DEFAULT_OPERATION,
  OPERATIONS,
  getOperationDefaults,
  type OperationDefinition,
  type OperationId,
  type OperationParamValues,
} from "@/lib/operations";

export interface UploadAsset {
  id: string;
  name: string;
  size: number;
  type: string;
  previewUrl: string;
  uploadedAt: number;
}

export interface ProcessingResult {
  jobId: string;
  url: string | null;
  metrics?: Record<string, number>;
  completedAt?: number;
}

export interface HistoryEntry {
  id: string;
  operationId: OperationId;
  params: OperationParamValues;
  createdAt: number;
  imageName: string;
  resultUrl?: string | null;
  metrics?: Record<string, number>;
}

export type JobStatus = "idle" | "queued" | "processing" | "completed" | "error";

interface ProcessingState {
  operations: OperationDefinition[];
  selectedOperationId: OperationId;
  params: Record<OperationId, OperationParamValues>;
  originalImage?: UploadAsset;
  previewImage?: string | null;
  result?: ProcessingResult;
  progress: number;
  jobStatus: JobStatus;
  error?: string | null;
  history: HistoryEntry[];
  uploading: boolean;
  processing: boolean;
  setOperation: (id: OperationId) => void;
  updateParam: (
    operationId: OperationId,
    paramId: string,
    value: number | boolean | string | [number, number],
  ) => void;
  resetParams: (operationId: OperationId) => void;
  setUpload: (asset?: UploadAsset) => void;
  setPreviewImage: (url?: string | null) => void;
  setResult: (result?: ProcessingResult) => void;
  setProgress: (value: number) => void;
  setJobStatus: (status: JobStatus) => void;
  setError: (error?: string | null) => void;
  pushHistory: (entry: HistoryEntry) => void;
  setUploading: (value: boolean) => void;
  setProcessing: (value: boolean) => void;
  resetSession: () => void;
}

const operationalDefaults = getOperationDefaults();

type ProcessingStateCore = Omit<
  ProcessingState,
  | "setOperation"
  | "updateParam"
  | "resetParams"
  | "setUpload"
  | "setPreviewImage"
  | "setResult"
  | "setProgress"
  | "setJobStatus"
  | "setError"
  | "pushHistory"
  | "setUploading"
  | "setProcessing"
  | "resetSession"
>;

const initialState: ProcessingStateCore = {
  operations: OPERATIONS,
  selectedOperationId: DEFAULT_OPERATION.id,
  params: operationalDefaults,
  originalImage: undefined,
  previewImage: undefined,
  result: undefined,
  progress: 0,
  jobStatus: "idle",
  error: null,
  history: [],
  uploading: false,
  processing: false,
};

type PersistedState = Partial<ProcessingStateCore> & {
  params?: Record<OperationId, OperationParamValues>;
  selectedOperationId?: OperationId;
  history?: HistoryEntry[];
};

export const useProcessingStore = create<ProcessingState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setOperation: (id) => set({ selectedOperationId: id }),
      updateParam: (operationId, paramId, value) =>
        set((state) => ({
          params: {
            ...state.params,
            [operationId]: {
              ...state.params[operationId],
              [paramId]: value,
            },
          },
        })),
      resetParams: (operationId) =>
        set((state) => ({
          params: {
            ...state.params,
            [operationId]: { ...operationalDefaults[operationId] },
          },
        })),
      setUpload: (asset) => {
        const previous = get().originalImage;
        if (previous?.previewUrl && previous.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previous.previewUrl);
        }
        set({
          originalImage: asset,
          previewImage: undefined,
          result: undefined,
          progress: 0,
          jobStatus: asset ? "queued" : "idle",
          error: null,
        });
      },
      setPreviewImage: (url) => set({ previewImage: url ?? undefined }),
      setResult: (result) =>
        set({
          result,
          jobStatus: result ? "completed" : get().jobStatus,
        }),
      setProgress: (value) => set({ progress: value }),
      setJobStatus: (status) => set({ jobStatus: status }),
      setError: (error) => set({ error }),
      pushHistory: (entry) =>
        set((state) => ({
          history: [entry, ...state.history].slice(0, 20),
        })),
      setUploading: (value) => set({ uploading: value }),
      setProcessing: (value) => set({ processing: value }),
      resetSession: () => {
        const previous = get().originalImage;
        if (previous?.previewUrl && previous.previewUrl.startsWith("blob:")) {
          URL.revokeObjectURL(previous.previewUrl);
        }
        set({
          ...initialState,
          history: get().history,
          params: get().params,
          selectedOperationId: get().selectedOperationId,
        });
      },
    }),
    {
      name: "aintra-processing-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        history: state.history,
        params: state.params,
        selectedOperationId: state.selectedOperationId,
      }),
      version: 1,
      migrate: (persisted: PersistedState | undefined) => ({
        ...initialState,
        ...(persisted ?? {}),
        operations: OPERATIONS,
      }),
    },
  ),
);


