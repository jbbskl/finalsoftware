"""
Cryptographic utilities for encrypting bot cookies at rest.
"""

import os
import tempfile
import shutil
from typing import Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import secrets
import base64


class CryptoError(Exception):
    """Raised when cryptographic operations fail."""
    pass


def generate_key() -> bytes:
    """
    Generate a random 32-byte key for AES-256-GCM.
    
    Returns:
        32-byte key suitable for AES-256-GCM encryption
    """
    return secrets.token_bytes(32)


def derive_key_from_password(password: Union[str, bytes], salt: bytes) -> bytes:
    """
    Derive a 32-byte key from a password using PBKDF2.
    
    Args:
        password: Password string or bytes
        salt: Random salt bytes
        
    Returns:
        32-byte derived key
    """
    if isinstance(password, str):
        password = password.encode('utf-8')
    
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
    )
    
    return kdf.derive(password)


def encrypt_file(src_path: str, dst_path: str, key: bytes) -> None:
    """
    Encrypt a file using AES-256-GCM.
    
    The encrypted file format is: salt(32) + iv(12) + tag(16) + ciphertext
    
    Args:
        src_path: Path to source file to encrypt
        dst_path: Path to write encrypted file
        key: 32-byte encryption key
        
    Raises:
        CryptoError: If encryption fails
    """
    if len(key) != 32:
        raise CryptoError("Key must be exactly 32 bytes")
    
    try:
        # Read source file
        with open(src_path, 'rb') as f:
            plaintext = f.read()
        
        # Generate random salt and IV
        salt = secrets.token_bytes(32)
        iv = secrets.token_bytes(12)  # 12 bytes for GCM
        
        # Derive key from master key and salt
        derived_key = derive_key_from_password(key, salt)
        
        # Encrypt
        aesgcm = AESGCM(derived_key)
        ciphertext = aesgcm.encrypt(iv, plaintext, None)
        
        # Write encrypted file: salt + iv + ciphertext
        with open(dst_path, 'wb') as f:
            f.write(salt)
            f.write(iv)
            f.write(ciphertext)
            
    except Exception as e:
        raise CryptoError(f"Failed to encrypt file: {e}")


def decrypt_file(src_path: str, dst_path: str, key: bytes) -> None:
    """
    Decrypt a file using AES-256-GCM.
    
    Args:
        src_path: Path to encrypted file
        dst_path: Path to write decrypted file
        key: 32-byte decryption key
        
    Raises:
        CryptoError: If decryption fails
    """
    if len(key) != 32:
        raise CryptoError("Key must be exactly 32 bytes")
    
    try:
        # Read encrypted file
        with open(src_path, 'rb') as f:
            data = f.read()
        
        if len(data) < 60:  # 32 (salt) + 12 (iv) + 16 (min tag)
            raise CryptoError("Encrypted file too short")
        
        # Extract components
        salt = data[:32]
        iv = data[32:44]
        ciphertext = data[44:]
        
        # Derive key from master key and salt
        derived_key = derive_key_from_password(key, salt)
        
        # Decrypt
        aesgcm = AESGCM(derived_key)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        
        # Write decrypted file
        with open(dst_path, 'wb') as f:
            f.write(plaintext)
            
    except Exception as e:
        raise CryptoError(f"Failed to decrypt file: {e}")


def encrypt_string(plaintext: str, key: bytes) -> str:
    """
    Encrypt a string and return base64-encoded result.
    
    Args:
        plaintext: String to encrypt
        key: 32-byte encryption key
        
    Returns:
        Base64-encoded encrypted data
        
    Raises:
        CryptoError: If encryption fails
    """
    if len(key) != 32:
        raise CryptoError("Key must be exactly 32 bytes")
    
    try:
        # Generate random IV
        iv = secrets.token_bytes(12)
        
        # Encrypt
        aesgcm = AESGCM(key)
        ciphertext = aesgcm.encrypt(iv, plaintext.encode('utf-8'), None)
        
        # Combine IV + ciphertext and encode
        combined = iv + ciphertext
        return base64.b64encode(combined).decode('ascii')
        
    except Exception as e:
        raise CryptoError(f"Failed to encrypt string: {e}")


def decrypt_string(encrypted_data: str, key: bytes) -> str:
    """
    Decrypt a base64-encoded string.
    
    Args:
        encrypted_data: Base64-encoded encrypted data
        key: 32-byte decryption key
        
    Returns:
        Decrypted string
        
    Raises:
        CryptoError: If decryption fails
    """
    if len(key) != 32:
        raise CryptoError("Key must be exactly 32 bytes")
    
    try:
        # Decode base64
        combined = base64.b64decode(encrypted_data)
        
        if len(combined) < 28:  # 12 (iv) + 16 (min tag)
            raise CryptoError("Encrypted data too short")
        
        # Extract IV and ciphertext
        iv = combined[:12]
        ciphertext = combined[12:]
        
        # Decrypt
        aesgcm = AESGCM(key)
        plaintext = aesgcm.decrypt(iv, ciphertext, None)
        
        return plaintext.decode('utf-8')
        
    except Exception as e:
        raise CryptoError(f"Failed to decrypt string: {e}")


def encrypt_bot_cookies(src_path: str, dst_path: str, cookie_key: bytes) -> None:
    """
    Encrypt bot cookies file for storage.
    
    Args:
        src_path: Path to source cookies file (JSON)
        dst_path: Path to write encrypted cookies file
        cookie_key: 32-byte cookie encryption key
    """
    # Ensure source file exists
    if not os.path.exists(src_path):
        raise CryptoError(f"Source file does not exist: {src_path}")
    
    # Ensure destination directory exists
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    
    # Encrypt the file
    encrypt_file(src_path, dst_path, cookie_key)


def decrypt_bot_cookies_to_temp(encrypted_path: str, cookie_key: bytes) -> str:
    """
    Decrypt bot cookies to a temporary file.
    
    Args:
        encrypted_path: Path to encrypted cookies file
        cookie_key: 32-byte cookie decryption key
        
    Returns:
        Path to temporary decrypted file
        
    Raises:
        CryptoError: If decryption fails
    """
    # Ensure encrypted file exists
    if not os.path.exists(encrypted_path):
        raise CryptoError(f"Encrypted file does not exist: {encrypted_path}")
    
    # Create temporary file
    temp_fd, temp_path = tempfile.mkstemp(suffix='.json', prefix='cookies_')
    
    try:
        # Decrypt to temporary file
        decrypt_file(encrypted_path, temp_path, cookie_key)
        
        # Close the file descriptor (we'll open it again when needed)
        os.close(temp_fd)
        
        return temp_path
        
    except Exception:
        # Clean up on error
        try:
            os.close(temp_fd)
            os.unlink(temp_path)
        except:
            pass
        raise


def cleanup_temp_file(temp_path: str) -> None:
    """
    Clean up a temporary file.
    
    Args:
        temp_path: Path to temporary file to delete
    """
    try:
        if os.path.exists(temp_path):
            os.unlink(temp_path)
    except Exception:
        pass  # Ignore cleanup errors


def get_cookie_key_from_env() -> bytes:
    """
    Get the cookie encryption key from environment variables.
    
    Returns:
        32-byte cookie encryption key
        
    Raises:
        CryptoError: If key is invalid or missing
    """
    import base64
    
    cookie_key_b64 = os.getenv("COOKIE_KEY")
    if not cookie_key_b64:
        raise CryptoError("COOKIE_KEY environment variable not set")
    
    try:
        cookie_key = base64.b64decode(cookie_key_b64)
        if len(cookie_key) != 32:
            raise CryptoError(f"COOKIE_KEY must be 32 bytes, got {len(cookie_key)}")
        return cookie_key
    except Exception as e:
        raise CryptoError(f"Invalid COOKIE_KEY: {e}")


# Example usage and testing
if __name__ == "__main__":
    import tempfile
    import json
    
    # Test encryption/decryption
    print("Testing crypto functions...")
    
    # Generate test key
    key = generate_key()
    print(f"Generated key: {base64.b64encode(key).decode()}")
    
    # Test string encryption
    test_string = "Hello, World! This is a test string."
    encrypted = encrypt_string(test_string, key)
    decrypted = decrypt_string(encrypted, key)
    
    print(f"Original: {test_string}")
    print(f"Encrypted: {encrypted}")
    print(f"Decrypted: {decrypted}")
    print(f"String test: {'✅ PASS' if test_string == decrypted else '❌ FAIL'}")
    
    # Test file encryption
    with tempfile.TemporaryDirectory() as temp_dir:
        # Create test file
        test_file = os.path.join(temp_dir, "test.json")
        encrypted_file = os.path.join(temp_dir, "test.enc")
        decrypted_file = os.path.join(temp_dir, "test_decrypted.json")
        
        test_data = {"cookies": [{"name": "session", "value": "abc123"}]}
        
        with open(test_file, 'w') as f:
            json.dump(test_data, f)
        
        # Encrypt
        encrypt_file(test_file, encrypted_file, key)
        print(f"File encrypted: {os.path.getsize(encrypted_file)} bytes")
        
        # Decrypt
        decrypt_file(encrypted_file, decrypted_file, key)
        
        with open(decrypted_file, 'r') as f:
            decrypted_data = json.load(f)
        
        print(f"File test: {'✅ PASS' if test_data == decrypted_data else '❌ FAIL'}")
    
    print("All tests completed!")