"""
Pose Detector - MediaPipe Pose wrapper
Returns 33 landmarks as [[x, y, z, visibility], ...]
"""
import mediapipe as mp
import numpy as np
import cv2
from config import POSE_MODEL_COMPLEXITY, MIN_DETECTION_CONFIDENCE, MIN_TRACKING_CONFIDENCE


class PoseDetector:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.mp_draw = mp.solutions.drawing_utils
        self.pose = self.mp_pose.Pose(
            model_complexity=POSE_MODEL_COMPLEXITY,
            min_detection_confidence=MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=MIN_TRACKING_CONFIDENCE,
        )

    def detect(self, frame):
        """
        Detect pose in a BGR frame.
        Returns: (landmarks_list, annotated_frame)
          landmarks_list: [[x, y, z, visibility], ...] for 33 joints, or None
        """
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.pose.process(rgb)

        landmarks_list = None
        if results.pose_landmarks:
            landmarks_list = []
            for lm in results.pose_landmarks.landmark:
                landmarks_list.append([lm.x, lm.y, lm.z, lm.visibility])

            # Draw skeleton on frame
            self.mp_draw.draw_landmarks(
                frame,
                results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                self.mp_draw.DrawingSpec(color=(0, 255, 186), thickness=2, circle_radius=2),
                self.mp_draw.DrawingSpec(color=(255, 255, 255), thickness=2),
            )

        return landmarks_list, frame

    def close(self):
        self.pose.close()
