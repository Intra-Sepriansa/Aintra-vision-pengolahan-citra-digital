"use client";

import Image from "next/image";
import { Download, Gauge, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatFileSize } from "@/lib/utils";
import { downloadResult } from "@/lib/api";
import { useProcessingStore } from "@/store/use-processing-store";

export function ResultsViewer() {
  const { originalImage, previewImage, result, progress, jobStatus, processing } =
    useProcessingStore((s) => ({
      originalImage: s.originalImage,
      previewImage: s.previewImage,
      result: s.result,
      progress: s.progress,
      jobStatus: s.jobStatus,
      processing: s.processing,
    }));

  const hasResult = Boolean(result?.url);

  return (
    <section id="hasil" className="mx-auto mt-16 max-w-6xl px-6">
      <Card className="border-neutral-200/80 bg-white/90">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-neutral-900">Area Hasil</CardTitle>
            <CardDescription className="text-neutral-500">
              Bandingkan Asli (kiri) dan Hasil (kanan). Unduh hasil di bawah.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <Gauge className="h-4 w-4" /> Status: {jobStatus}
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Dua kolom gambar */}
          <div className="grid gap-6 md:grid-cols-2">
            <figure className="rounded-3xl border border-neutral-200/80 bg-white p-3 shadow-sm">
              <figcaption className="mb-2 text-xs font-medium text-neutral-600">Asli</figcaption>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-50">
                {originalImage?.previewUrl ? (
                  <Image
                    src={originalImage.previewUrl}
                    alt={originalImage.name}
                    fill
                    sizes="(max-width:768px) 100vw, 50vw"
                    className="object-contain"
                  />
                ) : (
                  <div className="h-full w-full" />
                )}
              </div>
            </figure>

            <figure className="rounded-3xl border border-neutral-200/80 bg-white p-3 shadow-sm">
              <figcaption className="mb-2 text-xs font-medium text-neutral-600">Hasil</figcaption>
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-50">
                <Image
                  src={result?.url ?? previewImage ?? originalImage?.previewUrl ?? "/placeholder.png"}
                  alt={result ? "Hasil" : "Pratinjau"}
                  fill
                  sizes="(max-width:768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            </figure>
          </div>

          {/* Progress bar */}
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-800">Progress Pemrosesan</h3>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={cn("h-full rounded-full bg-neutral-900 transition-all", progress >= 100 && "bg-emerald-500")}
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-neutral-500">
              {processing ? `Proses berjalan ${Math.round(progress)}%` : hasResult ? "Pemrosesan selesai" : "Belum ada proses dijalankan"}
            </p>
          </div>

          {/* Detail & metrik di BAWAH */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-800">Detail Unggahan</h3>
              {originalImage ? (
                <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                  <li><span className="text-neutral-400">Nama:</span> {originalImage.name}</li>
                  <li><span className="text-neutral-400">Ukuran:</span> {formatFileSize(originalImage.size)}</li>
                  <li><span className="text-neutral-400">Tipe:</span> {originalImage.type}</li>
                  <li><span className="text-neutral-400">ID:</span> {originalImage.id}</li>
                </ul>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">Belum ada gambar diunggah.</p>
              )}
              <div className="mt-4">
                {hasResult ? (
                  <Button className="w-full" onClick={() => result?.jobId && downloadResult(result.jobId)}>
                    <Download className="mr-2 h-4 w-4" /> Unduh Hasil
                  </Button>
                ) : (
                  <Button className="w-full" variant="secondary" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menunggu Hasil
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-neutral-200/80 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-neutral-800">Metrik Kualitas</h3>
              {result?.metrics ? (
                <ul className="mt-4 space-y-2 text-sm text-neutral-600">
                  {Object.entries(result.metrics).map(([k, v]) => (
                    <li key={k} className="flex justify-between">
                      <span className="text-neutral-400">{k.toUpperCase()}</span>
                      <span className="font-semibold text-neutral-800">{v.toFixed(4)}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-neutral-500">Belum ada metrik.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
