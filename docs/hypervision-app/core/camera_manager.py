"""
Camera Manager - Handles both webcam and Basler camera capture
"""
import cv2
import numpy as np
from enum import Enum


class CameraType(Enum):
    WEBCAM = "webcam"
    BASLER = "basler"


class CameraManager:
    def __init__(self):
        self.cap = None
        self.camera_type = CameraType.WEBCAM
        self.is_running = False
        self.fps = 30
        self.frame_width = 640
        self.frame_height = 480

    def start_webcam(self, index: int = 0, width: int = 640, height: int = 480):
        """Start webcam capture"""
        self.cap = cv2.VideoCapture(index)
        if not self.cap.isOpened():
            raise RuntimeError(f"Cannot open webcam at index {index}")

        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, width)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, height)
        self.frame_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.frame_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps = int(self.cap.get(cv2.CAP_PROP_FPS)) or 30
        self.camera_type = CameraType.WEBCAM
        self.is_running = True
        print(f"📷 Webcam started: {self.frame_width}x{self.frame_height} @ {self.fps}fps")

    def start_basler(self):
        """Start Basler camera capture (requires pypylon)"""
        try:
            from pypylon import pylon

            tl_factory = pylon.TlFactory.GetInstance()
            devices = tl_factory.EnumerateDevices()
            if len(devices) == 0:
                raise RuntimeError("No Basler camera found")

            self.cap = pylon.InstantCamera(tl_factory.CreateDevice(devices[0]))
            self.cap.Open()

            # Configure for high speed
            self.cap.AcquisitionFrameRateEnable.SetValue(True)
            self.cap.AcquisitionFrameRate.SetValue(165.0)
            self.cap.ExposureTime.SetValue(5000)  # 5ms exposure

            self.cap.StartGrabbing(pylon.GrabStrategy_LatestImageOnly)
            self.camera_type = CameraType.BASLER
            self.fps = 165
            self.is_running = True
            print(f"📷 Basler camera started @ {self.fps}fps")

        except ImportError:
            raise RuntimeError(
                "pypylon not installed. Install Pylon Suite first, then: pip install pypylon"
            )

    def read_frame(self):
        """Read a single frame from the active camera"""
        if not self.is_running:
            return None

        if self.camera_type == CameraType.WEBCAM:
            ret, frame = self.cap.read()
            return frame if ret else None

        elif self.camera_type == CameraType.BASLER:
            from pypylon import pylon

            grab_result = self.cap.RetrieveResult(5000, pylon.TimeoutHandling_ThrowException)
            if grab_result.GrabSucceeded():
                converter = pylon.ImageFormatConverter()
                converter.OutputPixelFormat = pylon.PixelType_BGR8packed
                image = converter.Convert(grab_result)
                frame = image.GetArray()
                grab_result.Release()
                return frame
            grab_result.Release()
            return None

    def stop(self):
        """Stop camera capture"""
        self.is_running = False
        if self.cap is not None:
            if self.camera_type == CameraType.WEBCAM:
                self.cap.release()
            elif self.camera_type == CameraType.BASLER:
                self.cap.StopGrabbing()
                self.cap.Close()
            self.cap = None
        print("📷 Camera stopped")

    def get_info(self) -> dict:
        return {
            "type": self.camera_type.value,
            "fps": self.fps,
            "width": self.frame_width,
            "height": self.frame_height,
            "running": self.is_running,
        }
