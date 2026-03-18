"""
Bar Velocity Module
Tracks a colored marker on the barbell using HSV color detection.
Calculates velocity in pixels/frame → calibrated m/s.
"""
import cv2
import numpy as np
import time


class BarVelocityTracker:
    def __init__(self, fps: int = 30):
        self.fps = fps
        self.reset()
        # Default HSV range for bright green/yellow marker
        self.hsv_lower = np.array([35, 100, 100])
        self.hsv_upper = np.array([85, 255, 255])
        # Calibration: pixels per meter
        self.pixels_per_meter = None
        self.calibration_points = []

    def reset(self):
        self.positions = []
        self.velocities = []
        self.is_tracking = False
        self.rep_count = 0
        self.current_rep = []
        self.reps = []

    def set_hsv_range(self, lower: list, upper: list):
        """Set custom HSV range for marker detection"""
        self.hsv_lower = np.array(lower)
        self.hsv_upper = np.array(upper)
        print(f"🎨 HSV range: {lower} → {upper}")

    def calibrate(self, known_distance_cm: float, pixel_distance: float):
        """Calibrate pixels to real-world distance"""
        self.pixels_per_meter = pixel_distance / (known_distance_cm / 100)
        print(f"📏 Calibrated: {self.pixels_per_meter:.1f} px/m")

    def detect_marker(self, frame):
        """
        Detect colored marker in frame.
        Returns: (center_x, center_y, annotated_frame) or (None, None, frame)
        """
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
        mask = cv2.inRange(hsv, self.hsv_lower, self.hsv_upper)

        # Morphological operations to clean up mask
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.erode(mask, kernel, iterations=1)
        mask = cv2.dilate(mask, kernel, iterations=2)

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        if contours:
            largest = max(contours, key=cv2.contourArea)
            area = cv2.contourArea(largest)

            if area > 100:  # Minimum area threshold
                M = cv2.moments(largest)
                if M["m00"] > 0:
                    cx = int(M["m10"] / M["m00"])
                    cy = int(M["m01"] / M["m00"])

                    # Draw marker on frame
                    cv2.circle(frame, (cx, cy), 10, (0, 255, 186), -1)
                    cv2.circle(frame, (cx, cy), 15, (255, 255, 255), 2)

                    return cx, cy, frame

        return None, None, frame

    def process_frame(self, frame):
        """
        Process a frame for bar velocity tracking.
        Returns: dict with tracking data
        """
        cx, cy, annotated = self.detect_marker(frame)

        if cx is None:
            return {"status": "no_marker", "frame": annotated}

        timestamp = time.time()
        self.positions.append({
            "x": cx, "y": cy,
            "timestamp": timestamp,
            "frame_num": len(self.positions),
        })

        velocity_px = 0
        velocity_ms = None

        if len(self.positions) >= 2:
            prev = self.positions[-2]
            dx = cx - prev["x"]
            dy = cy - prev["y"]
            dist_px = np.sqrt(dx**2 + dy**2)
            velocity_px = dist_px * self.fps  # pixels per second

            if self.pixels_per_meter:
                velocity_ms = velocity_px / self.pixels_per_meter

        # Detect rep phases (up/down) based on y-direction
        self.current_rep.append({"x": cx, "y": cy, "v_px": velocity_px, "v_ms": velocity_ms})

        # Draw velocity on frame
        v_text = f"{velocity_ms:.2f} m/s" if velocity_ms else f"{velocity_px:.0f} px/s"
        cv2.putText(annotated, v_text, (cx + 20, cy - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 186), 2)

        result = {
            "status": "tracking",
            "marker_position": [cx, cy],
            "velocity_pixels_per_frame": round(velocity_px / self.fps, 2) if self.fps > 0 else 0,
            "velocity_pixels_per_second": round(velocity_px, 1),
            "calibrated_velocity_ms": round(velocity_ms, 3) if velocity_ms else None,
            "frame": annotated,
        }

        self.velocities.append(result)
        return result

    def finish_rep(self):
        """Mark end of current rep and calculate stats"""
        if not self.current_rep:
            return None

        velocities = [p["v_ms"] for p in self.current_rep if p["v_ms"] is not None]
        if not velocities:
            self.current_rep = []
            return None

        self.rep_count += 1
        rep_data = {
            "rep_number": self.rep_count,
            "peak_velocity_ms": round(max(velocities), 3),
            "avg_velocity_ms": round(sum(velocities) / len(velocities), 3),
            "data_points": len(self.current_rep),
        }
        self.reps.append(rep_data)
        self.current_rep = []

        print(f"🏋️ Rep #{rep_data['rep_number']}: "
              f"Peak {rep_data['peak_velocity_ms']} m/s, "
              f"Avg {rep_data['avg_velocity_ms']} m/s")

        return rep_data

    def get_results(self) -> dict:
        if not self.reps:
            return {"total_reps": 0}

        peak_velocities = [r["peak_velocity_ms"] for r in self.reps]
        return {
            "total_reps": len(self.reps),
            "best_peak_ms": max(peak_velocities),
            "avg_peak_ms": round(sum(peak_velocities) / len(peak_velocities), 3),
            "reps": self.reps,
        }
