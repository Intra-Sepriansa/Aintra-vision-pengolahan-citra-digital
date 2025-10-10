import numpy as np
import cv2

from app import img_ops
from app.schemas import OperationEnum


def _sample_image() -> np.ndarray:
    x = np.tile(np.linspace(0, 255, 64, dtype=np.uint8), (64, 1))
    y = x.T
    r = x
    g = y
    b = 255 - x
    return np.dstack([b, g, r])


def _assert_image(image: np.ndarray) -> None:
    assert image.dtype == np.uint8
    assert image.ndim in (2, 3)


def test_apply_operation_shapes():
    image = _sample_image()
    for operation in OperationEnum:
        params = {
            OperationEnum.GAMMA: {"gamma": 1.2},
            OperationEnum.LOG: {"gain": 1.5},
            OperationEnum.HISTOGRAM: {"method": "clahe"},
            OperationEnum.GEOMETRY: {"rotate": 12, "translate": [5, -3]},
            OperationEnum.THRESHOLD_GLOBAL: {"threshold": 120},
            OperationEnum.THRESHOLD_ADAPTIVE: {"mode": "adaptive_mean"},
        }.get(operation, {})
        result = img_ops.apply_operation(image, operation, params)
        _assert_image(result)
        assert result.shape[:2] == image.shape[:2]


def test_negative_preserves_alpha():
    alpha = np.full((32, 32, 1), 180, dtype=np.uint8)
    rgb = np.full((32, 32, 3), 100, dtype=np.uint8)
    image = np.concatenate([rgb, alpha], axis=2)
    result = img_ops.apply_operation(image, OperationEnum.NEGATIVE, {"preserveAlpha": True})
    assert np.array_equal(result[:, :, 3], alpha[:, :, 0])


def test_log_operation_increases_mean():
    image = _sample_image()
    before_mean = float(image.mean())
    result = img_ops.apply_operation(image, OperationEnum.LOG, {"gain": 2})
    after_mean = float(result.mean())
    assert after_mean > before_mean


def test_histogram_operation_clahe_improves_contrast():
    image = np.full((64, 64, 3), 120, dtype=np.uint8)
    cv2.rectangle(image, (8, 8), (56, 56), (200, 200, 200), -1)
    result = img_ops.apply_operation(image, OperationEnum.HISTOGRAM, {"method": "clahe"})
    assert float(result.std()) > float(image.std())


def test_threshold_global_binary_output():
    image = _sample_image()
    result = img_ops.apply_operation(image, OperationEnum.THRESHOLD_GLOBAL, {"threshold": 127})
    unique = np.unique(result)
    assert set(unique).issubset({0, 255})


def test_geometry_translation_effect():
    image = _sample_image()
    translated = img_ops.apply_operation(image, OperationEnum.GEOMETRY, {"translate": [10, 5]})
    assert not np.array_equal(image, translated)


def test_compute_metrics_values():
    image = _sample_image()
    blurred = cv2.GaussianBlur(image, (5, 5), 1.0)
    metrics = img_ops.compute_metrics(image, blurred)
    assert "ssim" in metrics and "psnr" in metrics
    assert 0 <= metrics["ssim"] <= 1
    assert metrics["psnr"] > 10
