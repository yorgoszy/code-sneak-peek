"""
Anthropometrics Module
Uses pose landmarks + reference object to estimate body measurements.
"""
import numpy as np


class AnthropometricsMeasurer:
    """
    Landmark indices (MediaPipe Pose):
    0: nose, 11-12: shoulders, 23-24: hips, 25-26: knees, 27-28: ankles
    15-16: wrists
    """

    def __init__(self):
        self.pixels_per_cm = None
        self.measurements = {}

    def calibrate(self, known_height_cm: float, pixel_height: float):
        """Calibrate using a known reference (e.g., person's height)"""
        self.pixels_per_cm = pixel_height / known_height_cm
        print(f"📏 Calibrated: {self.pixels_per_cm:.2f} px/cm")

    def _dist(self, p1, p2):
        """Euclidean distance between two landmarks [x, y, z, vis]"""
        return np.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)

    def _to_cm(self, pixel_dist):
        if self.pixels_per_cm and self.pixels_per_cm > 0:
            return round(pixel_dist / self.pixels_per_cm, 1)
        return None

    def measure(self, landmarks, frame_height: int = 480) -> dict:
        """
        Calculate body measurements from pose landmarks.
        landmarks: [[x, y, z, visibility], ...] normalized 0-1
        """
        if landmarks is None or len(landmarks) < 33:
            return {"status": "insufficient_landmarks"}

        # Convert normalized to pixel coordinates for distance calculation
        def px(lm):
            return [lm[0] * frame_height, lm[1] * frame_height]  # Rough approximation

        # Key measurements
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        left_hip = landmarks[23]
        right_hip = landmarks[24]
        left_knee = landmarks[25]
        right_knee = landmarks[26]
        left_ankle = landmarks[27]
        right_ankle = landmarks[28]
        left_wrist = landmarks[15]
        right_wrist = landmarks[16]
        nose = landmarks[0]

        # Shoulder width (normalized)
        shoulder_width = self._dist(left_shoulder, right_shoulder)

        # Arm span (wrist to wrist through shoulders)
        left_arm = self._dist(left_shoulder, left_wrist)
        right_arm = self._dist(right_shoulder, right_wrist)
        arm_span = left_arm + shoulder_width + right_arm

        # Torso length (mid-shoulder to mid-hip)
        mid_shoulder_y = (left_shoulder[1] + right_shoulder[1]) / 2
        mid_hip_y = (left_hip[1] + right_hip[1]) / 2
        torso_length = abs(mid_hip_y - mid_shoulder_y)

        # Leg length (hip to ankle)
        left_leg = self._dist(left_hip, left_knee) + self._dist(left_knee, left_ankle)
        right_leg = self._dist(right_hip, right_knee) + self._dist(right_knee, right_ankle)
        avg_leg = (left_leg + right_leg) / 2

        # Height estimate (nose to mid-ankle + head offset)
        mid_ankle_y = (left_ankle[1] + right_ankle[1]) / 2
        height_normalized = mid_ankle_y - nose[1] + 0.05  # +5% for top of head

        self.measurements = {
            "shoulder_width": round(shoulder_width, 4),
            "arm_span": round(arm_span, 4),
            "torso_length": round(torso_length, 4),
            "avg_leg_length": round(avg_leg, 4),
            "height_estimate": round(height_normalized, 4),
            "leg_torso_ratio": round(avg_leg / torso_length, 2) if torso_length > 0 else 0,
            "arm_span_height_ratio": round(arm_span / height_normalized, 2) if height_normalized > 0 else 0,
        }

        # Add cm values if calibrated
        if self.pixels_per_cm:
            scale = frame_height  # Convert normalized to pixel space
            self.measurements["shoulder_width_cm"] = self._to_cm(shoulder_width * scale)
            self.measurements["arm_span_cm"] = self._to_cm(arm_span * scale)
            self.measurements["height_cm"] = self._to_cm(height_normalized * scale)

        return self.measurements
