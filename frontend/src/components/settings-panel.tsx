"use client";

import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Download, Play, RefreshCcw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  downloadResult,
  fetchJobStatus,
  mapResultFromStatus,
  requestPreview,
  requestProcessing,
} from "@/lib/api";
import type { OperationParamDefinition } from "@/lib/operations";
import { cn, generateId } from "@/lib/utils";
import {
  type HistoryEntry,
  useProcessingStore,
} from "@/store/use-processing-store";

function ParameterField({
  definition,
  value,
  onChange,
}: {
  definition: OperationParamDefinition;
  value: number | boolean | string | [number, number] | undefined;
  onChange: (value: number | boolean | string | [number, number]) => void;
}) {
  if (definition.type === "slider") {
    const numericValue =
      typeof value === "number"
        ? value
        : Number(definition.defaultValue ?? 0);
    return (
      <div className="space-y-3">
        <Label htmlFor={definition.id} className="text-xs font-semibold text-neutral-600">
          {definition.label}
        </Label>
        <Slider
          id={definition.id}
          value={[numericValue]}
          min={definition.min}
          max={definition.max}
          step={definition.step ?? 1}
          onValueChange={(vals) => onChange(vals[0] ?? definition.defaultValue ?? 0)}
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{definition.min}</span>
          <span className="font-semibold text-neutral-700">{numericValue}</span>
          <span>{definition.max}</span>
        </div>
        {definition.description && (
          <p className="text-xs text-neutral-400">{definition.description}</p>
        )}
      </div>
    );
  }

  if (definition.type === "range") {
    const defaultRange = Array.isArray(definition.defaultValue)
      ? definition.defaultValue
      : [0, 0];
    const rangeValue = Array.isArray(value) ? value : (defaultRange as [number, number]);
    return (
      <div className="space-y-3">
        <Label htmlFor={definition.id} className="text-xs font-semibold text-neutral-600">
          {definition.label}
        </Label>
        <Slider
          id={definition.id}
          value={rangeValue}
          min={definition.min}
          max={definition.max}
          step={definition.step ?? 1}
          onValueChange={(vals) => onChange([vals[0] ?? 0, vals[1] ?? 0])}
        />
        <div className="flex justify-between text-xs text-neutral-500">
          <span>{definition.min}</span>
          <span className="font-semibold text-neutral-700">
            {rangeValue[0]}px · {rangeValue[1]}px
          </span>
          <span>{definition.max}</span>
        </div>
        {definition.description && (
          <p className="text-xs text-neutral-400">{definition.description}</p>
        )}
      </div>
    );
  }

  if (definition.type === "number") {
    const numericValue =
      typeof value === "number"
        ? value
        : Number(definition.defaultValue ?? 0);
    return (
      <div className="space-y-2">
        <Label htmlFor={definition.id} className="text-xs font-semibold text-neutral-600">
          {definition.label}
        </Label>
        <Input
          id={definition.id}
          type="number"
          min={definition.min}
          max={definition.max}
          step={definition.step ?? 1}
          value={numericValue}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        {definition.description && (
          <p className="text-xs text-neutral-400">{definition.description}</p>
        )}
      </div>
    );
  }

  if (definition.type === "select") {
    const options = definition.options ?? [];
    const currentValue = typeof value === "string" ? value : String(definition.defaultValue ?? "");
    return (
      <div className="space-y-2">
        <Label htmlFor={definition.id} className="text-xs font-semibold text-neutral-600">
          {definition.label}
        </Label>
        <select
          id={definition.id}
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-neutral-200"
          value={currentValue}
          onChange={(event) => onChange(event.target.value)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {definition.description && (
          <p className="text-xs text-neutral-400">{definition.description}</p>
        )}
      </div>
    );
  }

  if (definition.type === "switch") {
    const checked = typeof value === "boolean" ? value : Boolean(definition.defaultValue);
    return (
      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-neutral-700">{definition.label}</p>
          {definition.description && (
            <p className="mt-1 text-xs text-neutral-400">{definition.description}</p>
          )}
        </div>
        <Switch checked={checked} onCheckedChange={onChange as (value: boolean) => void} />
      </div>
    );
  }

  return null;
}

function initWebSocket(
  jobId: string,
  events: {
    onProgress: (value: number) => void;
    onStatus: (status: string) => void;
    onComplete: (payload: JobStatusResponse) => void;
    onError: (message: string) => void;
  },
) {
  if (typeof window === "undefined") return null;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    const wsUrl = baseUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/api/progress/${jobId}`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Partial<JobStatusResponse> & { error?: string };
        if (typeof data.progress === "number") events.onProgress(data.progress);
        if (data.status) events.onStatus(data.status);
        if (data.status === "completed") events.onComplete(data as JobStatusResponse);
        if (data.error) events.onError(data.error);
      } catch (error) {
        console.error("WebSocket parse", error);
        events.onError("Gagal membaca pesan progress");
      }
    };
    ws.onerror = () => events.onError("WebSocket error");
    return ws;
  } catch (error) {
    console.error("Tidak bisa inisiasi WebSocket", error);
    events.onError("Tidak bisa membuka WebSocket");
    return null;
  }
}

export function SettingsPanel() {
  const {
    operations,
    selectedOperationId,
    params,
    updateParam,
    resetParams,
    originalImage,
    setPreviewImage,
    setProcessing,
    setJobStatus,
    setProgress,
    setResult,
    pushHistory,
    processing,
    result,
    jobStatus,
    progress,
  } = useProcessingStore((state) => ({
    operations: state.operations,
    selectedOperationId: state.selectedOperationId,
    params: state.params,
    updateParam: state.updateParam,
    resetParams: state.resetParams,
    originalImage: state.originalImage,
    setPreviewImage: state.setPreviewImage,
    setProcessing: state.setProcessing,
    setJobStatus: state.setJobStatus,
    setProgress: state.setProgress,
    setResult: state.setResult,
    pushHistory: state.pushHistory,
    processing: state.processing,
    result: state.result,
    jobStatus: state.jobStatus,
    progress: state.progress,
  }));

  const selectedOperation = useMemo(
    () => operations.find((operation) => operation.id === selectedOperationId),
    [operations, selectedOperationId],
  );

  const selectedParams = params[selectedOperationId] ?? {};

  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    wsRef.current?.close();
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const canPreview = Boolean(originalImage && selectedOperation && !processing);
  const canProcess = Boolean(originalImage && selectedOperation && !processing);

  const handlePreview = async () => {
    if (!originalImage || !selectedOperation) {
      toast.error("Unggah gambar terlebih dahulu");
      return;
    }
    try {
      setProcessing(true);
      setJobStatus("processing");
      const response = await requestPreview(
        originalImage.id,
        selectedOperation.id,
        selectedParams,
      );
      setPreviewImage(response.preview_url);
      toast.success("Pratinjau diperbarui", {
        description: "Pratinjau resolusi rendah siap dibandingkan.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal menghasilkan pratinjau", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setProcessing(false);
      setJobStatus("idle");
      setProgress(0);
    }
  };

  const handleProcessingComplete = (entry: HistoryEntry) => {
    pushHistory(entry);
    toast.success("Pemrosesan selesai", { description: entry.operationId });
  };

  const startPolling = (jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await fetchJobStatus(jobId);
        setProgress(status.progress ?? 0);
        setJobStatus(status.status);
        if (status.status === "completed") {
          setProcessing(false);
          setProgress(100);
          const mapped = mapResultFromStatus(status) ?? result;
          if (mapped) {
            setResult(mapped);
            const entry: HistoryEntry = {
              id: generateId("history"),
              operationId: selectedOperationId,
              params: selectedParams,
              createdAt: Date.now(),
              imageName: originalImage?.name ?? "Gambar",
              resultUrl: mapped.url,
              metrics: mapped.metrics,
            };
            handleProcessingComplete(entry);
          }
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
        if (status.error) throw new Error(status.error);
      } catch (error) {
        console.error("Polling error", error);
        toast.error("Kesalahan saat polling status");
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        setProcessing(false);
      }
    }, 1500);
  };

  const handleProcess = async () => {
    if (!originalImage || !selectedOperation) {
      toast.error("Unggah gambar terlebih dahulu");
      return;
    }

    try {
      setProcessing(true);
      setJobStatus("queued");
      setProgress(5);

      const response = await requestProcessing(
        originalImage.id,
        selectedOperation.id,
        selectedParams,
      );

      setJobStatus(response.status);
      setProgress(20);

      const jobId = response.job_id;

      wsRef.current?.close();
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      const ws = initWebSocket(jobId, {
        onProgress: setProgress,
        onStatus: setJobStatus,
        onError: (message) => {
          toast.error("Progress bermasalah", { description: message });
        },
        onComplete: (payload) => {
          setProcessing(false);
          setProgress(100);
          const mapped = mapResultFromStatus(payload) ?? result;
          if (mapped) {
            setResult(mapped);
            const entry: HistoryEntry = {
              id: generateId("history"),
              operationId: selectedOperationId,
              params: selectedParams,
              createdAt: Date.now(),
              imageName: originalImage.name,
              resultUrl: mapped.url,
              metrics: mapped.metrics,
            };
            handleProcessingComplete(entry);
          }
        },
      });

      if (!ws) {
        startPolling(jobId);
      } else {
        wsRef.current = ws;
        ws.onclose = () => {
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        };
      }
    } catch (error) {
      console.error(error);
      setProcessing(false);
      setJobStatus("error");
      toast.error("Pemrosesan gagal", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <section id="pengaturan" className="mx-auto mt-16 max-w-6xl px-6">
      <div className="rounded-[32px] border border-neutral-200/80 bg-white/90 p-6 shadow-[0_30px_80px_-50px_rgba(15,23,42,0.55)] backdrop-blur">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-neutral-900">Pengaturan Operasi</h3>
            <p className="text-sm text-neutral-500">
              Sesuaikan parameter kemudian jalankan pratinjau atau proses penuh di backend FastAPI.
            </p>
          </div>
          {selectedOperation && (
            <div className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-xs text-neutral-500 shadow-sm">
              <div className="font-semibold text-neutral-800">{selectedOperation.name}</div>
              <div className="mt-1 capitalize text-neutral-400">Kategori · {selectedOperation.category}</div>
              {selectedOperation.recommended && (
                <p className="mt-2 text-neutral-500">{selectedOperation.recommended}</p>
              )}
            </div>
          )}
        </div>

        {!selectedOperation && (
          <div className="mt-6 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
            Pilih operasi terlebih dahulu pada galeri di atas untuk mengubah parameter.
          </div>
        )}

        {selectedOperation && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {selectedOperation.parameters.map((definition) => (
                <div key={definition.id} className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm">
                  <ParameterField
                    definition={definition}
                    value={selectedParams?.[definition.id]}
                    onChange={(val) => updateParam(selectedOperation.id, definition.id, val)}
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => selectedOperation && resetParams(selectedOperation.id)}
                disabled={!selectedOperation || processing}
              >
                <RefreshCcw className="mr-2 h-4 w-4" /> Reset Parameter
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreview}
                disabled={!canPreview}
              >
                <Sparkles className="mr-2 h-4 w-4" /> Pratinjau
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={handleProcess}
                disabled={!canProcess}
              >
                <Play className="mr-2 h-4 w-4" /> Jalankan Proses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => result?.jobId && downloadResult(result.jobId)}
                disabled={!result?.jobId}
              >
                <Download className="mr-2 h-4 w-4" /> Unduh Hasil Terakhir
              </Button>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-neutral-800">Progres Pemrosesan</p>
                  <p className="text-xs text-neutral-500">Status: {jobStatus}</p>
                </div>
                <div className="text-xs text-neutral-500">
                  {processing ? "Sedang berjalan" : "Tidak ada proses aktif"}
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                <div
                  className={cn(
                    "h-full rounded-full bg-neutral-900 transition-all",
                    progress >= 100 && "bg-emerald-500",
                  )}
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-neutral-500">
                {processing
                  ? `Pengolahan ${Math.round(progress)}%`
                  : result?.url
                  ? "Pemrosesan terakhir selesai"
                  : "Belum ada hasil yang diproses"}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}











