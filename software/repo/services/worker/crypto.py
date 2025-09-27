#!/usr/bin/env python3
"""
Crypto shim for worker service.
This is a development-safe shim that handles cookie encryption/decryption.
"""

import os
import tempfile
import shutil


class CryptoError(Exception):
    """Exception raised for crypto-related errors."""
    pass


def get_cookie_key_from_env():
    """Get the cookie encryption key from environment."""
    return os.environ.get("COOKIE_KEY", "")


def decrypt_bot_cookies_to_temp(src_path):
    """
    Decrypt bot cookies to a temporary file.
    
    Args:
        src_path: Path to encrypted cookie file
        
    Returns:
        str: Path to temporary decrypted file
        
    Raises:
        CryptoError: If decryption fails
    """
    try:
        # For development, check if .enc file exists, otherwise use .json
        if os.path.exists(src_path):
            # If it's an encrypted file, create a temp copy (in real implementation, decrypt here)
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
            temp_file.close()
            
            # For now, just copy the file (in production, this would decrypt)
            shutil.copy2(src_path, temp_file.name)
            return temp_file.name
        else:
            # Try .json version
            alt_path = src_path.replace(".enc", ".json")
            if os.path.exists(alt_path):
                return alt_path
            else:
                raise CryptoError(f"Cookie file not found: {src_path}")
                
    except Exception as e:
        raise CryptoError(f"Failed to decrypt cookies: {str(e)}")


def cleanup_temp_file(temp_path):
    """
    Clean up temporary file.
    
    Args:
        temp_path: Path to temporary file to clean up
    """
    try:
        if temp_path and os.path.exists(temp_path):
            # Only delete files in temp directory for safety
            if temp_path.startswith(tempfile.gettempdir()):
                os.remove(temp_path)
    except Exception:
        # Ignore cleanup errors
        pass


def encrypt_bot_cookies(src_path, dst_path, key):
    """
    Encrypt bot cookies (stub implementation).
    
    Args:
        src_path: Source file path
        dst_path: Destination encrypted file path
        key: Encryption key
        
    Raises:
        CryptoError: If encryption fails
    """
    try:
        # For development, just copy the file (in production, encrypt here)
        shutil.copy2(src_path, dst_path)
    except Exception as e:
        raise CryptoError(f"Failed to encrypt cookies: {str(e)}")