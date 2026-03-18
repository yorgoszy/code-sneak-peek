"""
Supabase Client - Communicates with the camera-bridge Edge Function
Sends processed data (NOT raw pixels) to the platform
"""
import httpx
import time
from config import CAMERA_BRIDGE_URL, SUPABASE_ANON_KEY


class SupabaseClient:
    def __init__(self):
        self.headers = {
            "Content-Type": "application/json",
            "apikey": SUPABASE_ANON_KEY,
        }
        self.client = httpx.Client(timeout=10.0)
        self.session_id = None
        self.module = None

    def start_session(self, module: str, **kwargs) -> str:
        """Start a new analysis session"""
        self.module = module
        payload = {
            "module": module,
            "action": "start_session",
            **kwargs,
        }
        response = self.client.post(CAMERA_BRIDGE_URL, json=payload, headers=self.headers)
        data = response.json()
        self.session_id = data.get("session_id")
        print(f"✅ Session started: {self.session_id} ({module})")
        return self.session_id

    def send_frame(self, frame_data: dict) -> dict:
        """Send a single processed frame"""
        if not self.session_id:
            return {"error": "No active session"}

        payload = {
            "module": self.module,
            "action": "send_frame",
            "session_id": self.session_id,
            "frame_data": frame_data,
        }
        response = self.client.post(CAMERA_BRIDGE_URL, json=payload, headers=self.headers)
        return response.json()

    def send_batch(self, frames: list) -> dict:
        """Send multiple processed frames at once"""
        if not self.session_id:
            return {"error": "No active session"}

        payload = {
            "module": self.module,
            "action": "send_batch",
            "session_id": self.session_id,
            "frames": frames,
        }
        response = self.client.post(CAMERA_BRIDGE_URL, json=payload, headers=self.headers)
        return response.json()

    def end_session(self) -> dict:
        """End the current session"""
        if not self.session_id:
            return {"error": "No active session"}

        payload = {
            "module": self.module,
            "action": "end_session",
            "session_id": self.session_id,
        }
        response = self.client.post(CAMERA_BRIDGE_URL, json=payload, headers=self.headers)
        data = response.json()
        print(f"🏁 Session ended: {self.session_id}")
        self.session_id = None
        return data

    def heartbeat(self) -> bool:
        """Check connection to the platform"""
        try:
            payload = {"module": "jump_analysis", "action": "heartbeat"}
            response = self.client.post(CAMERA_BRIDGE_URL, json=payload, headers=self.headers)
            return response.status_code == 200
        except Exception:
            return False

    def close(self):
        self.client.close()
