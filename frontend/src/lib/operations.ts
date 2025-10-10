import type { LucideIcon } from "lucide-react";
import {
  Circle,
  FunctionSquare,
  Gauge,
  BarChartBig,
  Waves,
  Ruler,
  Sparkles,
  Scan,
  Boxes,
  Move3d,
  Contrast,
  Binary,
} from "lucide-react";

export type OperationId =
  | "negative"
  | "log"
  | "gamma"
  | "histogram"
  | "gaussian"
  | "median"
  | "bilateral"
  | "sharpen"
  | "edge"
  | "morphology"
  | "geometry"
  | "threshold-global"
  | "threshold-adaptive";

export type OperationCategory =
  | "Enhancement"
  | "Filtering"
  | "Edge & Detail"
  | "Geometry"
  | "Segmentation";

export type OperationParamType =
  | "slider"
  | "number"
  | "select"
  | "switch"
  | "range";

export interface OperationParamDefinition {
  id: string;
  label: string;
  type: OperationParamType;
  min?: number;
  max?: number;
  step?: number;
  defaultValue: number | boolean | string | [number, number];
  description?: string;
  options?: { label: string; value: string }[];
}

export interface OperationDefinition {
  id: OperationId;
  name: string;
  shortDescription: string;
  category: OperationCategory;
  icon: LucideIcon;
  tags: string[];
  parameters: OperationParamDefinition[];
  recommended?: string;
}

export type OperationParamValues = Record<
  string,
  number | boolean | string | [number, number]
>;

export const OPERATIONS: OperationDefinition[] = [
  {
    id: "negative",
    name: "Negatif Citra",
    shortDescription:
      "Membalik intensitas piksel untuk menonjolkan struktur dan teks.",
    category: "Enhancement",
    icon: Circle,
    tags: ["kontras", "dasar"],
    parameters: [
      {
        id: "preserveAlpha",
        label: "Pertahankan Alfa",
        type: "switch",
        defaultValue: true,
        description: "Tidak membalik kanal transparansi untuk PNG/WEBP.",
      },
    ],
    recommended: "Gunakan untuk menonjolkan fitur pada dokumen negatif film.",
  },
  {
    id: "log",
    name: "Log Transform",
    shortDescription: "Ekspansi jangkauan intensitas untuk area gelap & terang.",
    category: "Enhancement",
    icon: FunctionSquare,
    tags: ["kontras", "tonal"],
    parameters: [
      {
        id: "gain",
        label: "Gain",
        type: "slider",
        min: 0.1,
        max: 5,
        step: 0.1,
        defaultValue: 1.0,
        description: "Kontrol intensitas transform logarithmic.",
      },
      {
        id: "base",
        label: "Basis Log",
        type: "select",
        defaultValue: "e",
        options: [
          { label: "Natural (e)", value: "e" },
          { label: "Basis 10", value: "10" },
          { label: "Basis 2", value: "2" },
        ],
      },
    ],
  },
  {
    id: "gamma",
    name: "Gamma Correction",
    shortDescription: "Koreksi gamma adaptif untuk kontrol pencahayaan.",
    category: "Enhancement",
    icon: Gauge,
    tags: ["tonal", "kontras"],
    parameters: [
      {
        id: "gamma",
        label: "Gamma",
        type: "slider",
        min: 0.2,
        max: 3,
        step: 0.05,
        defaultValue: 1.2,
      },
      {
        id: "gain",
        label: "Gain",
        type: "slider",
        min: 0.5,
        max: 2,
        step: 0.05,
        defaultValue: 1,
      },
    ],
  },
  {
    id: "histogram",
    name: "Histogram Equalization & CLAHE",
    shortDescription: "Distribusi ulang histogram global atau lokal.",
    category: "Enhancement",
    icon: BarChartBig,
    tags: ["kontras", "lokal"],
    parameters: [
      {
        id: "method",
        label: "Metode",
        type: "select",
        defaultValue: "clahe",
        options: [
          { label: "CLAHE", value: "clahe" },
          { label: "Equalization Global", value: "global" },
        ],
      },
      {
        id: "clipLimit",
        label: "Clip Limit",
        type: "slider",
        min: 1,
        max: 8,
        step: 0.5,
        defaultValue: 2.5,
        description: "Pembatas amplifikasi kontras pada CLAHE.",
      },
      {
        id: "tileGrid",
        label: "Grid Tiles",
        type: "slider",
        min: 2,
        max: 16,
        step: 1,
        defaultValue: 8,
        description: "Jumlah blok pembagi kanal pada CLAHE.",
      },
    ],
    recommended: "Cocok untuk foto dengan pencahayaan tidak merata.",
  },
  {
    id: "gaussian",
    name: "Gaussian Blur",
    shortDescription: "Pengaburan lembut untuk mereduksi noise gaussian.",
    category: "Filtering",
    icon: Waves,
    tags: ["denoise", "blur"],
    parameters: [
      {
        id: "kernel",
        label: "Kernel",
        type: "slider",
        min: 3,
        max: 21,
        step: 2,
        defaultValue: 5,
      },
      {
        id: "sigma",
        label: "Sigma",
        type: "slider",
        min: 0.1,
        max: 3,
        step: 0.1,
        defaultValue: 1.0,
      },
    ],
  },
  {
    id: "median",
    name: "Median Filter",
    shortDescription: "Filter median untuk noise impuls (salt & pepper).",
    category: "Filtering",
    icon: Ruler,
    tags: ["denoise", "impulse"],
    parameters: [
      {
        id: "kernel",
        label: "Kernel",
        type: "slider",
        min: 3,
        max: 15,
        step: 2,
        defaultValue: 3,
      },
    ],
  },
  {
    id: "bilateral",
    name: "Bilateral Filter",
    shortDescription: "Pelunakan tepi sadar warna tanpa blur detail.",
    category: "Filtering",
    icon: Waves,
    tags: ["denoise", "edge-preserving"],
    parameters: [
      {
        id: "diameter",
        label: "Diameter",
        type: "slider",
        min: 3,
        max: 15,
        step: 2,
        defaultValue: 9,
      },
      {
        id: "sigmaColor",
        label: "Sigma Warna",
        type: "slider",
        min: 10,
        max: 200,
        step: 5,
        defaultValue: 75,
      },
      {
        id: "sigmaSpace",
        label: "Sigma Spasial",
        type: "slider",
        min: 10,
        max: 200,
        step: 5,
        defaultValue: 75,
      },
    ],
  },
  {
    id: "sharpen",
    name: "Penajaman Laplacian",
    shortDescription: "Penegasan detail via Laplacian & unsharp masking.",
    category: "Edge & Detail",
    icon: Sparkles,
    tags: ["tajam", "detail"],
    parameters: [
      {
        id: "method",
        label: "Metode",
        type: "select",
        defaultValue: "unsharp",
        options: [
          { label: "Unsharp Mask", value: "unsharp" },
          { label: "Laplacian", value: "laplacian" },
        ],
      },
      {
        id: "amount",
        label: "Kuat Tajam",
        type: "slider",
        min: 0.2,
        max: 2,
        step: 0.05,
        defaultValue: 0.8,
      },
      {
        id: "radius",
        label: "Radius",
        type: "slider",
        min: 1,
        max: 10,
        step: 0.5,
        defaultValue: 2,
      },
    ],
  },
  {
    id: "edge",
    name: "Deteksi Tepi",
    shortDescription: "Sobel dan Canny untuk struktur kontur presisi.",
    category: "Edge & Detail",
    icon: Scan,
    tags: ["tepi", "deteksi"],
    parameters: [
      {
        id: "method",
        label: "Metode",
        type: "select",
        defaultValue: "canny",
        options: [
          { label: "Canny", value: "canny" },
          { label: "Sobel", value: "sobel" },
        ],
      },
      {
        id: "threshold1",
        label: "Ambang Rendah",
        type: "slider",
        min: 0,
        max: 255,
        step: 5,
        defaultValue: 50,
      },
      {
        id: "threshold2",
        label: "Ambang Tinggi",
        type: "slider",
        min: 0,
        max: 255,
        step: 5,
        defaultValue: 150,
      },
    ],
  },
  {
    id: "morphology",
    name: "Operasi Morfologi",
    shortDescription: "Bersihkan noise dan struktur dengan kernel fleksibel.",
    category: "Edge & Detail",
    icon: Boxes,
    tags: ["struktur", "biner"],
    parameters: [
      {
        id: "operation",
        label: "Operasi",
        type: "select",
        defaultValue: "open",
        options: [
          { label: "Opening", value: "open" },
          { label: "Closing", value: "close" },
          { label: "Erosi", value: "erode" },
          { label: "Dilasi", value: "dilate" },
        ],
      },
      {
        id: "kernel",
        label: "Ukuran Kernel",
        type: "slider",
        min: 3,
        max: 15,
        step: 2,
        defaultValue: 5,
      },
      {
        id: "iterations",
        label: "Iterasi",
        type: "slider",
        min: 1,
        max: 5,
        step: 1,
        defaultValue: 1,
      },
    ],
  },
  {
    id: "geometry",
    name: "Transformasi Geometri",
    shortDescription: "Rotasi, skala, translasi, dan crop adaptif.",
    category: "Geometry",
    icon: Move3d,
    tags: ["transform", "augment"],
    parameters: [
      {
        id: "rotate",
        label: "Rotasi ()",
        type: "slider",
        min: -180,
        max: 180,
        step: 1,
        defaultValue: 0,
      },
      {
        id: "scale",
        label: "Skala",
        type: "slider",
        min: 0.2,
        max: 2.5,
        step: 0.05,
        defaultValue: 1,
      },
      {
        id: "translate",
        label: "Translasi",
        type: "range",
        min: -200,
        max: 200,
        step: 1,
        defaultValue: [0, 0],
        description: "Geser sumbu X dan Y dalam piksel.",
      },
      {
        id: "crop",
        label: "Crop (%)",
        type: "slider",
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 0,
      },
    ],
  },
  {
    id: "threshold-global",
    name: "Threshold Global",
    shortDescription: "Segmentasi sederhana dengan ambang global tetap.",
    category: "Segmentation",
    icon: Contrast,
    tags: ["segmentasi", "biner"],
    parameters: [
      {
        id: "threshold",
        label: "Ambang",
        type: "slider",
        min: 0,
        max: 255,
        step: 1,
        defaultValue: 128,
      },
      {
        id: "maxValue",
        label: "Nilai Maks",
        type: "slider",
        min: 0,
        max: 255,
        step: 1,
        defaultValue: 255,
      },
    ],
  },
  {
    id: "threshold-adaptive",
    name: "Adaptive Threshold & Otsu",
    shortDescription: "Segmentasi adaptif dengan opsi Otsu otomatis.",
    category: "Segmentation",
    icon: Binary,
    tags: ["segmentasi", "otomatis"],
    parameters: [
      {
        id: "mode",
        label: "Mode",
        type: "select",
        defaultValue: "adaptive_gaussian",
        options: [
          { label: "Adaptive Gaussian", value: "adaptive_gaussian" },
          { label: "Adaptive Mean", value: "adaptive_mean" },
          { label: "Otsu", value: "otsu" },
        ],
      },
      {
        id: "blockSize",
        label: "Ukuran Blok",
        type: "slider",
        min: 3,
        max: 35,
        step: 2,
        defaultValue: 11,
      },
      {
        id: "constant",
        label: "Konstanta",
        type: "slider",
        min: -20,
        max: 20,
        step: 1,
        defaultValue: 2,
      },
      {
        id: "preblur",
        label: "Pre-blur",
        type: "select",
        defaultValue: "none",
        options: [
          { label: "Tanpa", value: "none" },
          { label: "Gaussian", value: "gaussian" },
          { label: "Median", value: "median" },
        ],
      },
    ],
  },
];

export const DEFAULT_OPERATION = OPERATIONS[0];

export function getOperationDefaults(): Record<
  OperationId,
  OperationParamValues
> {
  return OPERATIONS.reduce((acc, operation) => {
    acc[operation.id] = operation.parameters.reduce<OperationParamValues>(
      (paramAcc, param) => {
        paramAcc[param.id] = param.defaultValue;
        return paramAcc;
      },
      {},
    );
    return acc;
  }, {} as Record<OperationId, OperationParamValues>);
}
