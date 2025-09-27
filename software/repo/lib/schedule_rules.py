"""
Time rules and helpers for scheduling system.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import pytz


def get_app_timezone() -> str:
    """Get application timezone from environment variable."""
    return os.getenv("APP_TZ", "Europe/Amsterdam")


def get_timezone_obj() -> timezone:
    """Get timezone object for the application."""
    tz_name = get_app_timezone()
    return pytz.timezone(tz_name)


def can_create(start_at: datetime) -> bool:
    """
    Check if a schedule can be created.
    
    Rule: start_at >= now + 1 hour
    
    Args:
        start_at: Proposed start time
        
    Returns:
        True if schedule can be created, False otherwise
    """
    now = datetime.now(get_timezone_obj())
    min_start = now + timedelta(hours=1)
    
    # Ensure start_at is timezone-aware
    if start_at.tzinfo is None:
        start_at = get_timezone_obj().localize(start_at)
    
    return start_at >= min_start


def can_delete(start_at: datetime) -> bool:
    """
    Check if a schedule can be deleted.
    
    Rule: now <= start_at - 10 minutes
    
    Args:
        start_at: Schedule start time
        
    Returns:
        True if schedule can be deleted, False otherwise
    """
    now = datetime.now(get_timezone_obj())
    
    # Ensure start_at is timezone-aware
    if start_at.tzinfo is None:
        start_at = get_timezone_obj().localize(start_at)
    
    min_delete_time = start_at - timedelta(minutes=10)
    return now <= min_delete_time


def next_minute_floor(date: datetime) -> datetime:
    """
    Get the next minute floor (e.g., 10:30:45 -> 10:31:00).
    
    Args:
        date: Input datetime
        
    Returns:
        Datetime floored to next minute
    """
    # Ensure timezone-aware
    if date.tzinfo is None:
        date = get_timezone_obj().localize(date)
    
    # Floor to next minute
    next_minute = date.replace(second=0, microsecond=0)
    if date.second > 0 or date.microsecond > 0:
        next_minute += timedelta(minutes=1)
    
    return next_minute


def get_minute_key(date: datetime) -> str:
    """
    Generate a minute-based key for idempotency.
    
    Format: YYYY-MM-DD-HH-MM
    
    Args:
        date: Input datetime
        
    Returns:
        Minute-based key string
    """
    # Ensure timezone-aware
    if date.tzinfo is None:
        date = get_timezone_obj().localize(date)
    
    return date.strftime("%Y-%m-%d-%H-%M")


def is_within_dispatch_window(start_at: datetime, window_minutes: int = 2) -> bool:
    """
    Check if a schedule is within the dispatch window.
    
    Args:
        start_at: Schedule start time
        window_minutes: Window size in minutes (default: 2)
        
    Returns:
        True if within dispatch window
    """
    now = datetime.now(get_timezone_obj())
    
    # Ensure start_at is timezone-aware
    if start_at.tzinfo is None:
        start_at = get_timezone_obj().localize(start_at)
    
    window_start = now - timedelta(minutes=window_minutes)
    return window_start <= start_at <= now


def format_schedule_time(date: datetime) -> str:
    """
    Format datetime for schedule display.
    
    Args:
        date: Input datetime
        
    Returns:
        Formatted string
    """
    # Ensure timezone-aware
    if date.tzinfo is None:
        date = get_timezone_obj().localize(date)
    
    return date.strftime("%Y-%m-%d %H:%M")


def parse_schedule_time(date_str: str) -> datetime:
    """
    Parse schedule time string to datetime.
    
    Args:
        date_str: Date string in YYYY-MM-DD HH:MM format
        
    Returns:
        Parsed datetime in app timezone
    """
    tz = get_timezone_obj()
    
    # Parse the datetime string
    dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
    
    # Localize to app timezone
    return tz.localize(dt)


def copy_schedule_to_date(original_start: datetime, target_date: str) -> datetime:
    """
    Copy a schedule's time to a new date.
    
    Args:
        original_start: Original schedule start time
        target_date: Target date in YYYY-MM-DD format
        
    Returns:
        New datetime with same time but different date
    """
    # Ensure original is timezone-aware
    if original_start.tzinfo is None:
        original_start = get_timezone_obj().localize(original_start)
    
    # Parse target date
    target_dt = datetime.strptime(target_date, "%Y-%m-%d")
    target_dt = get_timezone_obj().localize(target_dt)
    
    # Copy time from original
    return target_dt.replace(
        hour=original_start.hour,
        minute=original_start.minute,
        second=original_start.second,
        microsecond=original_start.microsecond
    )