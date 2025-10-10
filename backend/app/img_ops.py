from __future__ import annotations

import math
from pathlib import Path
from typing import Dict, Optional

import cv2
import numpy as np
from skimage import exposure
from skimage.metrics import peak_signal_noise_ratio, structural_similarity

from .schemas import OperationEnum


def load_image(path: Path) -> np.ndarray:
    image = cv2.imread(str(path), cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError("Gagal memuat citra")
    return image


def split_alpha(image: np.ndarray) -> tuple[np.ndarray, Optional[np.ndarray]]:
    if image.ndim == 3 and image.shape[2] == 4:
        return image[:, :, :3], image[:, :, 3]
    return image, None


def merge_alpha(image: np.ndarray, alpha: Optional[np.ndarray]) -> np.ndarray:
    if alpha is None:
        return image
    if image.ndim == 2:
        image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    return np.dstack([image, alpha])


def as_gray(image: np.ndarray) -> np.ndarray:
    if image.ndim == 2:
        return image
    if image.shape[2] == 4:
        return cv2.cvtColor(image, cv2.COLOR_BGRA2GRAY)
    return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)


def to_uint8(image: np.ndarray) -> np.ndarray:
    return np.clip(image, 0, 255).astype(np.uint8)


def negative_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    preserve_alpha = bool(params.get("preserveAlpha", True))
    rgb, alpha = split_alpha(image)
    inverted = cv2.bitwise_not(rgb)
    if preserve_alpha:
        return merge_alpha(inverted, alpha)
    return cv2.bitwise_not(image)


def log_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    gain = float(params.get("gain", 1.0))
    base = str(params.get("base", "e"))
    rgb, alpha = split_alpha(image)
    normalized = rgb.astype(np.float32) / 255.0
    if base == "10":
        logged = gain * np.log10(1 + normalized)
    elif base == "2":
        logged = gain * np.log2(1 + normalized)
    else:
        logged = gain * np.log1p(normalized)
    logged = cv2.normalize(logged, None, 0, 255, cv2.NORM_MINMAX)
    return merge_alpha(to_uint8(logged), alpha)


def gamma_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    gamma = max(0.01, float(params.get("gamma", 1.0)))
    gain = float(params.get("gain", 1.0))
    rgb, alpha = split_alpha(image)
    inv_gamma = 1.0 / gamma
    table = np.array([(gain * ((i / 255.0) ** inv_gamma) * 255) for i in range(256)]).clip(0, 255).astype("uint8")
    corrected = cv2.LUT(rgb, table)
    return merge_alpha(corrected, alpha)


def histogram_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    method = params.get("method", "clahe")
    clip_limit = float(params.get("clipLimit", 2.5))
    tile_grid = int(params.get("tileGrid", 8))
    rgb, alpha = split_alpha(image)

    if method == "global":
        if rgb.ndim == 2:
            equalized = cv2.equalizeHist(rgb)
        else:
            yuv = cv2.cvtColor(rgb, cv2.COLOR_BGR2YCrCb)
            yuv[:, :, 0] = cv2.equalizeHist(yuv[:, :, 0])
            equalized = cv2.cvtColor(yuv, cv2.COLOR_YCrCb2BGR)
    else:
        clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=(tile_grid, tile_grid))
        if rgb.ndim == 2:
            equalized = clahe.apply(rgb)
        else:
            lab = cv2.cvtColor(rgb, cv2.COLOR_BGR2LAB)
            lab[:, :, 0] = clahe.apply(lab[:, :, 0])
            equalized = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    return merge_alpha(equalized, alpha)


def gaussian_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    kernel = int(params.get("kernel", 5))
    if kernel % 2 == 0:
        kernel += 1
    sigma = float(params.get("sigma", 1.0))
    return cv2.GaussianBlur(image, (kernel, kernel), sigma)


def median_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    kernel = int(params.get("kernel", 3))
    if kernel % 2 == 0:
        kernel += 1
    rgb, alpha = split_alpha(image)
    denoised = cv2.medianBlur(rgb, kernel)
    return merge_alpha(denoised, alpha)


def bilateral_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    diameter = int(params.get("diameter", 9))
    sigma_color = float(params.get("sigmaColor", 75))
    sigma_space = float(params.get("sigmaSpace", 75))
    filtered = cv2.bilateralFilter(image, diameter, sigma_color, sigma_space)
    return filtered


def sharpen_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    method = params.get("method", "unsharp")
    amount = float(params.get("amount", 1.0))
    radius = float(params.get("radius", 1.0))
    rgb, alpha = split_alpha(image)

    if method == "laplacian":
        lap = cv2.Laplacian(rgb, cv2.CV_16S, ksize=max(1, int(radius)))
        sharp = cv2.convertScaleAbs(rgb - amount * lap)
    else:
        blurred = cv2.GaussianBlur(rgb, (0, 0), radius)
        sharp = cv2.addWeighted(rgb, 1 + amount, blurred, -amount, 0)
    return merge_alpha(to_uint8(sharp), alpha)


def edge_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    method = params.get("method", "canny")
    t1 = float(params.get("threshold1", 50))
    t2 = float(params.get("threshold2", 150))
    gray = as_gray(image)

    if method == "sobel":
        grad_x = cv2.Sobel(gray, cv2.CV_16S, 1, 0)
        grad_y = cv2.Sobel(gray, cv2.CV_16S, 0, 1)
        abs_grad_x = cv2.convertScaleAbs(grad_x)
        abs_grad_y = cv2.convertScaleAbs(grad_y)
        sobel = cv2.addWeighted(abs_grad_x, 0.5, abs_grad_y, 0.5, 0)
        return cv2.cvtColor(sobel, cv2.COLOR_GRAY2BGR)
    edges = cv2.Canny(gray, t1, t2)
    return cv2.cvtColor(edges, cv2.COLOR_GRAY2BGR)


def morphology_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    operation = params.get("operation", "open")
    kernel_size = int(params.get("kernel", 5))
    iterations = int(params.get("iterations", 1))
    kernel_size = kernel_size + 1 if kernel_size % 2 == 0 else kernel_size
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (kernel_size, kernel_size))
    gray = as_gray(image)

    if operation == "close":
        transformed = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel, iterations=iterations)
    elif operation == "erode":
        transformed = cv2.erode(gray, kernel, iterations=iterations)
    elif operation == "dilate":
        transformed = cv2.dilate(gray, kernel, iterations=iterations)
    else:
        transformed = cv2.morphologyEx(gray, cv2.MORPH_OPEN, kernel, iterations=iterations)
    return cv2.cvtColor(transformed, cv2.COLOR_GRAY2BGR)


def geometry_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    rotate_deg = float(params.get("rotate", 0))
    scale = float(params.get("scale", 1.0))
    translate = params.get("translate", [0, 0])
    if isinstance(translate, list) and len(translate) == 2:
        tx, ty = float(translate[0]), float(translate[1])
    else:
        tx = ty = 0.0
    crop = float(params.get("crop", 0))

    h, w = image.shape[:2]
    center = (w / 2, h / 2)
    matrix = cv2.getRotationMatrix2D(center, rotate_deg, scale)
    matrix[0, 2] += tx
    matrix[1, 2] += ty
    transformed = cv2.warpAffine(image, matrix, (w, h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)

    if crop > 0:
        crop = np.clip(crop, 0, 40)
        x = int((crop / 100) * w)
        y = int((crop / 100) * h)
        transformed = transformed[y : h - y or h, x : w - x or w]
        transformed = cv2.resize(transformed, (w, h), interpolation=cv2.INTER_LINEAR)
    return transformed


def threshold_global_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    threshold = float(params.get("threshold", 128))
    max_value = float(params.get("maxValue", 255))
    gray = as_gray(image)
    _, binary = cv2.threshold(gray, threshold, max_value, cv2.THRESH_BINARY)
    return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)


def adaptive_threshold_operation(image: np.ndarray, params: Dict) -> np.ndarray:
    mode = params.get("mode", "adaptive_gaussian")
    block_size = int(params.get("blockSize", 11))
    if block_size % 2 == 0:
        block_size += 1
    constant = int(params.get("constant", 2))
    preblur = params.get("preblur", "none")

    gray = as_gray(image)
    if preblur == "gaussian":
        gray = cv2.GaussianBlur(gray, (5, 5), 0)
    elif preblur == "median":
        gray = cv2.medianBlur(gray, 3)

    if mode == "otsu":
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    else:
        adaptive_method = cv2.ADAPTIVE_THRESH_GAUSSIAN_C if mode == "adaptive_gaussian" else cv2.ADAPTIVE_THRESH_MEAN_C
        binary = cv2.adaptiveThreshold(gray, 255, adaptive_method, cv2.THRESH_BINARY, block_size, constant)
    return cv2.cvtColor(binary, cv2.COLOR_GRAY2BGR)


def threshold_operations(image: np.ndarray, operation: OperationEnum, params: Dict) -> np.ndarray:
    if operation == OperationEnum.THRESHOLD_GLOBAL:
        return threshold_global_operation(image, params)
    return adaptive_threshold_operation(image, params)


OPERATION_MAP = {
    OperationEnum.NEGATIVE: negative_operation,
    OperationEnum.LOG: log_operation,
    OperationEnum.GAMMA: gamma_operation,
    OperationEnum.HISTOGRAM: histogram_operation,
    OperationEnum.GAUSSIAN: gaussian_operation,
    OperationEnum.MEDIAN: median_operation,
    OperationEnum.BILATERAL: bilateral_operation,
    OperationEnum.SHARPEN: sharpen_operation,
    OperationEnum.EDGE: edge_operation,
    OperationEnum.MORPHOLOGY: morphology_operation,
    OperationEnum.GEOMETRY: geometry_operation,
    OperationEnum.THRESHOLD_GLOBAL: lambda image, params: threshold_operations(image, OperationEnum.THRESHOLD_GLOBAL, params),
    OperationEnum.THRESHOLD_ADAPTIVE: lambda image, params: threshold_operations(image, OperationEnum.THRESHOLD_ADAPTIVE, params),
}


def apply_operation(image: np.ndarray, operation: OperationEnum, params: Dict) -> np.ndarray:
    handler = OPERATION_MAP.get(operation)
    if handler is None:
        raise ValueError(f"Operasi {operation} tidak didukung")
    result = handler(image, params)
    return to_uint8(result)


def generate_preview(image: np.ndarray, operation: OperationEnum, params: Dict, max_width: int = 640) -> np.ndarray:
    h, w = image.shape[:2]
    if w > max_width:
        ratio = max_width / float(w)
        image = cv2.resize(image, (int(w * ratio), int(h * ratio)), interpolation=cv2.INTER_AREA)
    processed = apply_operation(image, operation, params)
    return processed


def compute_metrics(original: np.ndarray, processed: np.ndarray) -> Dict[str, float]:
    try:
        original_gray = as_gray(original)
        processed_gray = as_gray(processed)
        ssim = structural_similarity(original_gray, processed_gray, data_range=255)
        psnr = peak_signal_noise_ratio(original_gray, processed_gray, data_range=255)
        return {"ssim": float(ssim), "psnr": float(psnr)}
    except Exception:
        return {}

