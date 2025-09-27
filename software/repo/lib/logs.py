"""
Log file tailing helper for bot instance logs.
"""

import os
import time
from typing import Generator, Optional
from pathlib import Path


def tail_file(file_path: str, delay: float = 0.1) -> Generator[str, None, None]:
    """
    Tail a file and yield new lines as they appear.
    
    Args:
        file_path: Path to the file to tail
        delay: Delay between checks for new content (seconds)
        
    Yields:
        New lines as they appear in the file
    """
    if not os.path.exists(file_path):
        yield f"Log file not found: {file_path}\n"
        return
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            # Go to end of file
            f.seek(0, 2)
            
            while True:
                line = f.readline()
                if line:
                    yield line
                else:
                    time.sleep(delay)
    except Exception as e:
        yield f"Error reading log file: {str(e)}\n"


def get_latest_log_file(logs_dir: str, pattern: str = "run-*.log") -> Optional[str]:
    """
    Get the latest log file in a directory matching a pattern.
    
    Args:
        logs_dir: Directory containing log files
        pattern: File pattern to match (default: "run-*.log")
        
    Returns:
        Path to the latest log file, or None if none found
    """
    if not os.path.exists(logs_dir):
        return None
    
    log_files = []
    for file in os.listdir(logs_dir):
        if file.startswith("run-") and file.endswith(".log"):
            file_path = os.path.join(logs_dir, file)
            if os.path.isfile(file_path):
                log_files.append(file_path)
    
    if not log_files:
        return None
    
    # Return the most recently modified file
    return max(log_files, key=os.path.getmtime)


def create_log_file(logs_dir: str, run_id: str, content: str = "") -> str:
    """
    Create a new log file for a run.
    
    Args:
        logs_dir: Directory to create the log file in
        run_id: Run ID for the log file
        content: Initial content for the log file
        
    Returns:
        Path to the created log file
    """
    os.makedirs(logs_dir, exist_ok=True)
    
    timestamp = time.strftime("%Y%m%d-%H%M%S")
    log_file = os.path.join(logs_dir, f"run-{timestamp}-{run_id}.log")
    
    with open(log_file, 'w', encoding='utf-8') as f:
        if content:
            f.write(content)
        else:
            f.write(f"Starting run {run_id} at {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    return log_file


def append_to_log(log_file: str, message: str):
    """
    Append a message to a log file.
    
    Args:
        log_file: Path to the log file
        message: Message to append
    """
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(f"{time.strftime('%Y-%m-%d %H:%M:%S')} - {message}\n")