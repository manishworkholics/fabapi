from typing import List, Dict, Any, Optional, Union

# These schemas define the expected data structures for our API

class ColumnPrediction:
    """Represents ML predictions for a column."""
    primary_category: str
    primary_confidence: float
    secondary_category: str
    secondary_confidence: float

class ColumnData:
    """Represents a column from the uploaded Excel file with predictions."""
    name: str
    sample_values: List[Any]
    prediction: ColumnPrediction

class UploadResponse:
    """Response for the upload endpoint."""
    success: bool
    file_name: str
    columns: List[ColumnData]
    row_count: int

class ColumnMapping:
    """User-selected mapping for a column."""
    name: str
    mapping: str

class ProcessBomRequest:
    """Request body for the process-bom endpoint."""
    file_name: str
    columns: List[ColumnMapping]

class ProcessBomResponse:
    """Response for the process-bom endpoint."""
    success: bool
    message: str
    mapping_id: str

class StreamRequest:
    """Request body for the stream-digikey-results endpoint."""
    mapping_id: str

class BomRow:
    """Represents a row from the BOM."""
    row_index: int
    mpns: List[str]
    manufacturer: Optional[str]

class PriceBreak:
    """Represents a price break from DigiKey API."""
    quantity: int
    price: float
    currency: str = "USD"

class PartSubstitute:
    """Represents a substitute part recommendation."""
    mpn: str
    manufacturer: str
    status: str
    price: float
    description: str
    price_breaks: Optional[List[PriceBreak]] = None

class StreamProgress:
    """Progress update event for streaming API."""
    event: str = "progress"
    data: Dict[str, Any]

class FoundResult:
    """Found part event for streaming API."""
    event: str = "found"
    data: Dict[str, Any]

class NotFoundResult:
    """Not found part event for streaming API."""
    event: str = "not_found"
    data: Dict[str, Any]

class CompleteResult:
    """Complete event for streaming API."""
    event: str = "complete"
    data: Dict[str, Any]

# Define a union type for all streaming results
StreamResult = Union[StreamProgress, FoundResult, NotFoundResult, CompleteResult]