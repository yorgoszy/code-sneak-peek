"""
Pose Detector - MediaPipe Pose wrapper (compatible with mediapipe >= 0.10.14)
Returns 33 landmarks as [[x, y, z, visibility], ...]

Uses the new Tasks API since mp.solutions was removed in recent versions.
Falls back to legacy API if available.
"""
import numpy as np
import cv2
from config import MIN_DETECTION_CONFIDENCE, MIN_TRACKING_CONFIDENCE

# Try new Tasks API first, fallback to legacy
try:
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision
    from mediapipe import solutions as mp_solutions
    USE_LEGACY = True
except ImportError:
    USE_LEGACY = False

try:
    import mediapipe as mp
    if hasattr(mp, 'solutions'):
        USE_LEGACY = True
    else:
        USE_LEGACY = False
except Exception:
    USE_LEGACY = False


class PoseDetector:
    def __init__(self):
        if USE_LEGACY:
            self._init_legacy()
        else:
            self._init_tasks()

    def _init_legacy(self):
        """Legacy API (mediapipe < 0.10.14)"""
        import mediapipe as mp
        self.mode = "legacy"
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            model_complexity=1,
            min_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
        )
        print("✅ PoseDetector: Legacy API")

    def _init_tasks(self):
        """New Tasks API (mediapipe >= 0.10.14)"""
        from mediapipe.tasks.python import vision
        from mediapipe.tasks.python import BaseOptions
        import mediapipe as mp

        self.mode = "tasks"
        self.mp = mp

        # Download model if needed
        import urllib.request
        import os
        model_path = os.path.join(os.path.dirname(__file__), "pose_landmarker_full.task")
        if not os.path.exists(model_path):
            print("📥 Downloading pose model...")
            url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"
            urllib.request.urlretrieve(url, model_path)
            print("✅ Model downloaded")

        base_options = BaseOptions(model_asset_path=model_path)
        options = vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=vision.RunningMode.IMAGE,
            min_pose_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
        )
        self.landmarker = vision.PoseLandmarker.create_from_options(options)
        print("✅ PoseDetector: Tasks API")

    def detect(self, frame):
        """
        Detect pose in a BGR frame.
        Returns: (landmarks_list, annotated_frame)
          landmarks_list: [[x, y, z, visibility], ...] for 33 joints, or None
        """
        if self.mode == "legacy":
            return self._detect_legacy(frame)
        else:
            return self._detect_tasks(frame)

    def _detect_legacy(self, frame):
        import mediapipe as mp
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        landmarks_list = None
        if results.pose_landmarks:
            landmarks_list = []
            for lm in results.pose_landmarks.landmark:
                landmarks_list.append([lm.x, lm.y, lm.z, lm.visibility])

            mp_draw = mp.solutions.drawing_utils
            mp_pose = mp.solutions.pose
            mp_draw.draw_landmarks(
                frame,
                results.pose_landmarks,
                mp_pose.POSE_CONNECTIONS,
                mp_draw.DrawingSpec(color=(0, 255, 186), thickness=2, circle_radius=2),
                mp_draw.DrawingSpec(color=(255, 255, 186), thickness=2),
            )

        return landmarks_list, frame

    def _detect_tasks(self, frame):
        from mediapipe.tasks.python import vision
        import mediapipe as mp

        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
        result = self.landmarker.detect(mp_image)

        landmarks_list = None
        if result.pose_landmarks and len(result.pose_landmarks) > 0:
            landmarks_list = []
            pose = result.pose_landmarks[0]
            h, w = frame.shape[:2]

            for lm in pose:
                landmarks_list.append([lm.x, lm.y, lm.z, lm.visibility])

            # Draw landmarks manually
            for lm in pose:
                cx, cy = int(lm.x * w), int(lm.y * h)
                cv2.circle(frame, (cx, cy), 3, (0, 255, 186), -1)

            # Draw connections
            connections = [
                (11, 12), (11, 13), (13, 15), (12, 14), (14, 16),
                (11, 23), (12, 24), (23, 24), (23, 25), (24, 26),
                (25, 27), (26, 28), (27, 29), (28, 30), (29, 31), (30, 32),
            ]
            for i, j in connections:
                if i < len(pose) and j < len(pose):
                    p1 = (int(pose[i].x * w), int(pose[i].y * h))
                    p2 = (int(pose[j].x * w), int(pose[j].y * h))
                    cv2.line(frame, p1, p2, (255, 255, 255), 2)

        return landmarks_list, frame

    def close(self):
        if self.mode == "legacy":
            self.pose.close()
        else:
            self.landmarker.close()
