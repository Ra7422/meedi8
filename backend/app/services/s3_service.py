"""
S3 Service - Handles audio file uploads to AWS S3
"""
import boto3
import os
from datetime import datetime
import hashlib
from botocore.exceptions import ClientError

# AWS Configuration - Read at runtime, not import time
def get_s3_client():
    """
    Lazy-initialize S3 client to ensure environment variables are loaded.
    Railway injects env vars after module import, so we need to read them at runtime.
    """
    aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
    aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
    aws_s3_bucket = os.getenv("AWS_S3_BUCKET", "clean-air-voice-recordings")
    aws_region = os.getenv("AWS_REGION", "us-east-1")

    if not aws_access_key_id or not aws_secret_access_key:
        raise Exception(f"AWS credentials missing. Access Key: {'present' if aws_access_key_id else 'missing'}, Secret Key: {'present' if aws_secret_access_key else 'missing'}")

    return boto3.client(
        's3',
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name=aws_region
    ), aws_s3_bucket, aws_region


def upload_file_to_s3(file_bytes: bytes, room_id: int, user_id: int, filename: str, content_type: str = "application/octet-stream") -> str:
    """
    Upload any file to S3 and return the public URL.

    Args:
        file_bytes: The file content as bytes
        room_id: The room ID
        user_id: The user ID
        filename: Original filename
        content_type: MIME type of the file

    Returns:
        str: The public URL of the uploaded file

    Raises:
        Exception: If upload fails
    """
    try:
        # Get S3 client at runtime
        s3_client, aws_s3_bucket, aws_region = get_s3_client()

        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(file_bytes).hexdigest()[:8]
        # Preserve file extension
        file_extension = filename.split('.')[-1] if '.' in filename else 'file'
        safe_filename = filename.rsplit('.', 1)[0][:50]  # Limit filename length
        s3_key = f"evidence/room_{room_id}/user_{user_id}/{timestamp}_{file_hash}_{safe_filename}.{file_extension}"

        # Upload to S3
        s3_client.put_object(
            Bucket=aws_s3_bucket,
            Key=s3_key,
            Body=file_bytes,
            ContentType=content_type
        )

        # Generate public URL
        url = f"https://{aws_s3_bucket}.s3.{aws_region}.amazonaws.com/{s3_key}"

        print(f"File uploaded successfully to S3: {url}")
        return url

    except ClientError as e:
        error_message = f"S3 upload failed: {e}"
        print(error_message)
        raise Exception(error_message)
    except Exception as e:
        error_message = f"Unexpected error uploading to S3: {e}"
        print(error_message)
        raise Exception(error_message)


def upload_audio_to_s3(audio_bytes: bytes, room_id: int, user_id: int, filename: str = "recording.webm") -> str:
    """
    Upload audio file to S3 and return the public URL.

    Args:
        audio_bytes: The audio file content as bytes
        room_id: The room ID
        user_id: The user ID
        filename: Original filename (default: recording.webm)

    Returns:
        str: The public URL of the uploaded file

    Raises:
        Exception: If upload fails
    """
    try:
        # Get S3 client at runtime
        s3_client, aws_s3_bucket, aws_region = get_s3_client()

        # Generate unique filename
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        file_hash = hashlib.md5(audio_bytes).hexdigest()[:8]
        file_extension = filename.split('.')[-1] if '.' in filename else 'webm'
        s3_key = f"voice-recordings/room_{room_id}/user_{user_id}/{timestamp}_{file_hash}.{file_extension}"

        # Upload to S3
        s3_client.put_object(
            Bucket=aws_s3_bucket,
            Key=s3_key,
            Body=audio_bytes,
            ContentType='audio/webm'
        )

        # Generate public URL
        url = f"https://{aws_s3_bucket}.s3.{aws_region}.amazonaws.com/{s3_key}"

        print(f"Audio uploaded successfully to S3: {url}")
        return url

    except ClientError as e:
        error_message = f"S3 upload failed: {e}"
        print(error_message)
        raise Exception(error_message)
    except Exception as e:
        error_message = f"Unexpected error uploading to S3: {e}"
        print(error_message)
        raise Exception(error_message)


def delete_audio_from_s3(audio_url: str) -> bool:
    """
    Delete audio file from S3.

    Args:
        audio_url: The full S3 URL of the file

    Returns:
        bool: True if deleted successfully, False otherwise
    """
    try:
        # Get S3 client at runtime
        s3_client, aws_s3_bucket, aws_region = get_s3_client()

        # Extract S3 key from URL
        # URL format: https://bucket-name.s3.region.amazonaws.com/key
        if f"s3.{aws_region}.amazonaws.com" not in audio_url:
            print(f"Invalid S3 URL: {audio_url}")
            return False

        s3_key = audio_url.split(f"s3.{aws_region}.amazonaws.com/")[1]

        # Delete from S3
        s3_client.delete_object(
            Bucket=aws_s3_bucket,
            Key=s3_key
        )

        print(f"Audio deleted successfully from S3: {s3_key}")
        return True

    except Exception as e:
        print(f"Error deleting audio from S3: {e}")
        return False
