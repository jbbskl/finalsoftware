"""
Input validation schemas and utilities using Pydantic.
"""

from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, validator, ValidationError
from datetime import datetime, timezone
import json
import logging

logger = logging.getLogger(__name__)


class ValidationErrorResponse(BaseModel):
    """Standardized error response format."""
    error: str
    code: str
    details: Optional[Dict[str, Any]] = None


# Bot Instance Validation Schemas

class CookieUploadRequest(BaseModel):
    """Schema for cookie upload validation."""
    # File uploads are handled separately by FastAPI
    pass


class BotValidateRequest(BaseModel):
    """Schema for bot validation requests."""
    instance_id: str = Field(..., min_length=1, max_length=100)


class BotStartRequest(BaseModel):
    """Schema for bot start requests."""
    instance_id: str = Field(..., min_length=1, max_length=100)
    config_override: Optional[Dict[str, Any]] = None


class BotStopRequest(BaseModel):
    """Schema for bot stop requests."""
    instance_id: str = Field(..., min_length=1, max_length=100)


# Phase Validation Schemas

class PhaseCreateRequest(BaseModel):
    """Schema for phase creation."""
    name: str = Field(..., min_length=1, max_length=100)
    order_no: int = Field(..., ge=1, le=200)
    config_json: Dict[str, Any] = Field(..., min_items=1)
    
    @validator('config_json')
    def validate_config_json(cls, v):
        """Validate that config_json is a valid JSON object."""
        if not isinstance(v, dict):
            raise ValueError('config_json must be a dictionary')
        
        # Check for required fields
        required_fields = ['type', 'settings']
        for field in required_fields:
            if field not in v:
                raise ValueError(f'config_json must contain {field}')
        
        return v


class PhaseUpdateRequest(BaseModel):
    """Schema for phase updates."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    order_no: Optional[int] = Field(None, ge=1, le=200)
    config_json: Optional[Dict[str, Any]] = None
    
    @validator('config_json')
    def validate_config_json(cls, v):
        """Validate that config_json is a valid JSON object if provided."""
        if v is not None and not isinstance(v, dict):
            raise ValueError('config_json must be a dictionary')
        return v


# Schedule Validation Schemas

class ScheduleCreateRequest(BaseModel):
    """Schema for schedule creation."""
    bot_instance_id: str = Field(..., min_length=1, max_length=100)
    kind: str = Field(..., regex='^(full|phase)$')
    phase_id: Optional[str] = Field(None, min_length=1, max_length=100)
    start_at: str = Field(..., min_length=10)  # ISO datetime string
    payload_json: Optional[Dict[str, Any]] = None
    
    @validator('phase_id')
    def validate_phase_id(cls, v, values):
        """Validate that phase_id is provided when kind is 'phase'."""
        if values.get('kind') == 'phase' and not v:
            raise ValueError('phase_id is required when kind is "phase"')
        return v
    
    @validator('start_at')
    def validate_start_at(cls, v):
        """Validate ISO datetime format."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('start_at must be a valid ISO datetime string')
        return v


class ScheduleUpdateRequest(BaseModel):
    """Schema for schedule updates."""
    start_at: Optional[str] = Field(None, min_length=10)
    payload_json: Optional[Dict[str, Any]] = None
    
    @validator('start_at')
    def validate_start_at(cls, v):
        """Validate ISO datetime format if provided."""
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError('start_at must be a valid ISO datetime string')
        return v


class CopyDayRequest(BaseModel):
    """Schema for copy day requests."""
    bot_instance_id: str = Field(..., min_length=1, max_length=100)
    from_date: str = Field(..., min_length=10)
    to_date: str = Field(..., min_length=10)
    
    @validator('from_date', 'to_date')
    def validate_date(cls, v):
        """Validate ISO date format."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('Date must be a valid ISO datetime string')
        return v


# Billing Validation Schemas

class InvoiceCreateRequest(BaseModel):
    """Schema for invoice creation."""
    kind: str = Field(..., regex='^(creator|agency)$')
    bots: Optional[List[str]] = Field(None, min_items=1)
    platforms: Optional[List[str]] = Field(None, min_items=1)
    models: Optional[int] = Field(None, ge=1, le=1000)
    
    @validator('bots', 'platforms')
    def validate_lists(cls, v):
        """Validate list items."""
        if v is not None:
            for item in v:
                if not isinstance(item, str) or len(item.strip()) == 0:
                    raise ValueError('List items must be non-empty strings')
        return v


class WebhookRequest(BaseModel):
    """Schema for webhook requests."""
    invoice_id: str = Field(..., min_length=1, max_length=100)
    event: str = Field(..., min_length=1, max_length=50)


# Run Validation Schemas

class RunListRequest(BaseModel):
    """Schema for run list requests."""
    bot_instance_id: Optional[str] = Field(None, min_length=1, max_length=100)
    limit: int = Field(50, ge=1, le=1000)
    offset: int = Field(0, ge=0)


# Admin Validation Schemas

class AdminListRequest(BaseModel):
    """Schema for admin list requests."""
    status: Optional[str] = Field(None, min_length=1, max_length=50)
    limit: int = Field(50, ge=1, le=1000)
    offset: int = Field(0, ge=0)


# Validation Functions

def validate_request_data(schema_class: type, data: Dict[str, Any]) -> BaseModel:
    """
    Validate request data against a Pydantic schema.
    
    Args:
        schema_class: Pydantic model class
        data: Request data to validate
        
    Returns:
        Validated model instance
        
    Raises:
        ValidationError: If validation fails
    """
    try:
        return schema_class(**data)
    except ValidationError as e:
        logger.warning(f"Validation failed for {schema_class.__name__}: {e}")
        raise


def validate_json_string(json_str: str) -> Dict[str, Any]:
    """
    Validate and parse JSON string.
    
    Args:
        json_str: JSON string to validate
        
    Returns:
        Parsed JSON object
        
    Raises:
        ValidationError: If JSON is invalid
    """
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as e:
        raise ValidationError(f"Invalid JSON: {str(e)}")


def validate_bot_code(bot_code: str) -> bool:
    """
    Validate bot code format.
    
    Args:
        bot_code: Bot code to validate
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If invalid
    """
    valid_codes = [
        'f2f_post', 'f2f_dm', 'of_post', 'of_dm', 
        'fanvue_post', 'fanvue_dm', 'fancentro_post', 'fancentro_dm',
        'fansly_post', 'fansly_dm'
    ]
    
    if bot_code not in valid_codes:
        raise ValidationError(f"Invalid bot_code: {bot_code}. Must be one of: {valid_codes}")
    
    return True


def validate_owner_type(owner_type: str) -> bool:
    """
    Validate owner type.
    
    Args:
        owner_type: Owner type to validate
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If invalid
    """
    valid_types = ['user', 'org']
    
    if owner_type not in valid_types:
        raise ValidationError(f"Invalid owner_type: {owner_type}. Must be one of: {valid_types}")
    
    return True


def validate_role(role: str) -> bool:
    """
    Validate user role.
    
    Args:
        role: Role to validate
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If invalid
    """
    valid_roles = ['creator', 'agency', 'admin']
    
    if role not in valid_roles:
        raise ValidationError(f"Invalid role: {role}. Must be one of: {valid_roles}")
    
    return True


def validate_file_upload(file_content: bytes, max_size: int = 10 * 1024 * 1024) -> bool:
    """
    Validate file upload.
    
    Args:
        file_content: File content bytes
        max_size: Maximum file size in bytes
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If invalid
    """
    if len(file_content) == 0:
        raise ValidationError("File cannot be empty")
    
    if len(file_content) > max_size:
        raise ValidationError(f"File too large. Maximum size: {max_size} bytes")
    
    return True


def validate_cookie_file(file_content: bytes) -> bool:
    """
    Validate cookie file content.
    
    Args:
        file_content: Cookie file content
        
    Returns:
        True if valid
        
    Raises:
        ValidationError: If invalid
    """
    # Basic file size check
    validate_file_upload(file_content, 5 * 1024 * 1024)  # 5MB max
    
    # Try to parse as JSON
    try:
        cookie_data = json.loads(file_content.decode('utf-8'))
        
        # Basic structure validation
        if not isinstance(cookie_data, (dict, list)):
            raise ValidationError("Cookie file must contain a JSON object or array")
        
        # If it's a dict, check for common cookie structure
        if isinstance(cookie_data, dict):
            if 'cookies' in cookie_data:
                cookies = cookie_data['cookies']
                if not isinstance(cookies, list):
                    raise ValidationError("Cookies must be an array")
                
                # Validate individual cookies
                for cookie in cookies:
                    if not isinstance(cookie, dict):
                        raise ValidationError("Each cookie must be an object")
                    
                    required_fields = ['name', 'value']
                    for field in required_fields:
                        if field not in cookie:
                            raise ValidationError(f"Cookie missing required field: {field}")
        
        return True
        
    except json.JSONDecodeError:
        raise ValidationError("Cookie file must be valid JSON")
    except UnicodeDecodeError:
        raise ValidationError("Cookie file must be valid UTF-8")


# Error Response Helpers

def create_error_response(error_message: str, error_code: str, status_code: int = 400, details: Optional[Dict] = None) -> Dict[str, Any]:
    """
    Create standardized error response.
    
    Args:
        error_message: Human-readable error message
        error_code: Machine-readable error code
        status_code: HTTP status code
        details: Additional error details
        
    Returns:
        Error response dictionary
    """
    response = {
        "error": error_message,
        "code": error_code
    }
    
    if details:
        response["details"] = details
    
    return response


def map_validation_error_to_http(validation_error: ValidationError) -> tuple:
    """
    Map Pydantic validation error to HTTP response.
    
    Args:
        validation_error: Pydantic ValidationError
        
    Returns:
        Tuple of (status_code, error_response)
    """
    error_details = []
    
    for error in validation_error.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_details.append({
            "field": field,
            "message": message,
            "type": error["type"]
        })
    
    return 422, create_error_response(
        "Validation failed",
        "validation_error",
        422,
        {"validation_errors": error_details}
    )


def map_database_error_to_http(error: Exception) -> tuple:
    """
    Map database errors to HTTP responses.
    
    Args:
        error: Database exception
        
    Returns:
        Tuple of (status_code, error_response)
    """
    error_message = str(error).lower()
    
    if "unique constraint" in error_message or "duplicate key" in error_message:
        return 409, create_error_response(
            "Resource already exists",
            "conflict",
            409
        )
    elif "foreign key constraint" in error_message:
        return 400, create_error_response(
            "Referenced resource does not exist",
            "invalid_reference",
            400
        )
    elif "not null constraint" in error_message:
        return 400, create_error_response(
            "Required field is missing",
            "missing_field",
            400
        )
    else:
        return 500, create_error_response(
            "Database error occurred",
            "database_error",
            500
        )


# Example usage and testing
if __name__ == "__main__":
    # Test validation schemas
    print("Testing validation schemas...")
    
    # Test PhaseCreateRequest
    try:
        phase_data = {
            "name": "Test Phase",
            "order_no": 1,
            "config_json": {
                "type": "posting",
                "settings": {"interval": 30}
            }
        }
        phase = PhaseCreateRequest(**phase_data)
        print(f"✅ Phase validation passed: {phase.name}")
    except ValidationError as e:
        print(f"❌ Phase validation failed: {e}")
    
    # Test ScheduleCreateRequest
    try:
        schedule_data = {
            "bot_instance_id": "bot-123",
            "kind": "full",
            "start_at": "2024-01-15T10:00:00Z"
        }
        schedule = ScheduleCreateRequest(**schedule_data)
        print(f"✅ Schedule validation passed: {schedule.kind}")
    except ValidationError as e:
        print(f"❌ Schedule validation failed: {e}")
    
    # Test cookie validation
    try:
        cookie_json = '{"cookies": [{"name": "session", "value": "abc123"}]}'
        validate_cookie_file(cookie_json.encode('utf-8'))
        print("✅ Cookie validation passed")
    except ValidationError as e:
        print(f"❌ Cookie validation failed: {e}")
    
    print("Validation tests completed!")