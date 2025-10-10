from enum import Enum
from typing import Any, Dict, Literal, Optional

from pydantic import BaseModel, Field

OperationParamMap = Dict[str, Any]


class OperationEnum(str, Enum):
    NEGATIVE = "negative"
    LOG = "log"
    GAMMA = "gamma"
    HISTOGRAM = "histogram"
    GAUSSIAN = "gaussian"
    MEDIAN = "median"
    BILATERAL = "bilateral"
    SHARPEN = "sharpen"
    EDGE = "edge"
    MORPHOLOGY = "morphology"
    GEOMETRY = "geometry"
    THRESHOLD_GLOBAL = "threshold-global"
    THRESHOLD_ADAPTIVE = "threshold-adaptive"


JobStatus = Literal["idle", "queued", "processing", "completed", "error"]


class UploadResponse(BaseModel):
    image_id: str
    filename: str
    content_type: str
    size: int


class PreviewRequest(BaseModel):
    image_id: str
    operation: OperationEnum
    params: OperationParamMap = Field(default_factory=dict)


class PreviewResponse(BaseModel):
    preview_url: str
    metrics: Optional[Dict[str, float]] = None


class ProcessRequest(BaseModel):
    image_id: str
    operation: OperationEnum
    params: OperationParamMap = Field(default_factory=dict)


class ProcessResponse(BaseModel):
    job_id: str
    status: JobStatus
    eta_ms: Optional[int] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int = 0
    result_url: Optional[str] = None
    metrics: Optional[Dict[str, float]] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: Literal["ok"] = "ok"
    uptime_seconds: float
    jobs_in_queue: int
