"""
Jump Analysis Module
Detects takeoff and landing using ankle landmarks.
Calculates jump height from flight time: h = g * t² / 8
"""
import time
import numpy as np


class JumpAnalyzer:
    # MediaPipe landmark indices
    LEFT_ANKLE = 27
    RIGHT_ANKLE = 28
    LEFT_HIP = 23
    RIGHT_HIP = 24

    def __init__(self, fps: int = 30):
        self.fps = fps
        self.reset()

    def reset(self):
        self.ground_level = None
        self.is_airborne = False
        self.takeoff_frame = None
        self.landing_frame = None
        self.frame_count = 0
        self.jumps = []
        self.ankle_history = []
        self.calibrated = False
        # Threshold in normalized coordinates (percentage of frame height)
        self.takeoff_threshold = 0.02  # 2% of frame height

    def calibrate_ground(self, landmarks):
        """Set ground level from current standing position (ankles)"""
        if landmarks is None:
            return False

        left_ankle = landmarks[self.LEFT_ANKLE]
        right_ankle = landmarks[self.RIGHT_ANKLE]
        avg_ankle_y = (left_ankle[1] + right_ankle[1]) / 2
        self.ground_level = avg_ankle_y
        self.calibrated = True
        print(f"📏 Ground calibrated at y={self.ground_level:.4f}")
        return True

    def process_frame(self, landmarks):
        """
        Process a frame's pose landmarks for jump detection.
        Returns: dict with current state and any completed jump data
        """
        self.frame_count += 1

        if landmarks is None or not self.calibrated:
            return {"status": "waiting", "frame": self.frame_count}

        left_ankle = landmarks[self.LEFT_ANKLE]
        right_ankle = landmarks[self.RIGHT_ANKLE]
        avg_ankle_y = (left_ankle[1] + right_ankle[1]) / 2

        # In MediaPipe, y=0 is top, y=1 is bottom
        # So "up" means ankle_y < ground_level
        displacement = self.ground_level - avg_ankle_y

        self.ankle_history.append({
            "frame": self.frame_count,
            "ankle_y": avg_ankle_y,
            "displacement": displacement,
            "timestamp": time.time(),
        })

        # Detect takeoff
        if not self.is_airborne and displacement > self.takeoff_threshold:
            self.is_airborne = True
            self.takeoff_frame = self.frame_count
            return {
                "status": "takeoff",
                "frame": self.frame_count,
                "displacement": displacement,
            }

        # Detect landing
        if self.is_airborne and displacement < self.takeoff_threshold * 0.5:
            self.is_airborne = False
            self.landing_frame = self.frame_count

            # Calculate flight time and jump height
            flight_frames = self.landing_frame - self.takeoff_frame
            flight_time = flight_frames / self.fps
            g = 9.81
            jump_height_m = (g * flight_time ** 2) / 8
            jump_height_cm = jump_height_m * 100

            # Find peak displacement
            relevant = [h for h in self.ankle_history
                       if self.takeoff_frame <= h["frame"] <= self.landing_frame]
            peak_displacement = max(h["displacement"] for h in relevant) if relevant else 0

            jump_data = {
                "status": "landed",
                "jump_number": len(self.jumps) + 1,
                "flight_frames": flight_frames,
                "flight_time_s": round(flight_time, 4),
                "jump_height_cm": round(jump_height_cm, 1),
                "peak_displacement": round(peak_displacement, 4),
                "fps": self.fps,
                "accuracy_mm": round(1000 / (2 * self.fps * (2 * g * jump_height_m) ** 0.5), 1) if jump_height_m > 0 else 0,
            }

            self.jumps.append(jump_data)
            print(f"🦘 Jump #{jump_data['jump_number']}: {jump_data['jump_height_cm']}cm "
                  f"(flight: {jump_data['flight_time_s']}s, {flight_frames} frames)")

            return jump_data

        return {
            "status": "airborne" if self.is_airborne else "grounded",
            "frame": self.frame_count,
            "displacement": round(displacement, 4),
        }

    def get_results(self) -> dict:
        """Get summary of all jumps"""
        if not self.jumps:
            return {"total_jumps": 0}

        heights = [j["jump_height_cm"] for j in self.jumps]
        return {
            "total_jumps": len(self.jumps),
            "best_jump_cm": max(heights),
            "avg_jump_cm": round(sum(heights) / len(heights), 1),
            "jumps": self.jumps,
        }
