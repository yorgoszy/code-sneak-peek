"""
HyperVision Configuration
Loads Supabase credentials from .env file
"""
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dicwdviufetibnafzipa.supabase.co")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")
CAMERA_BRIDGE_URL = f"{SUPABASE_URL}/functions/v1/camera-bridge"

# Camera settings
DEFAULT_WEBCAM_INDEX = 0
DEFAULT_FPS = 30
BASLER_FPS = 165

# MediaPipe settings
POSE_MODEL_COMPLEXITY = 1  # 0=lite, 1=full, 2=heavy
MIN_DETECTION_CONFIDENCE = 0.5
MIN_TRACKING_CONFIDENCE = 0.5
