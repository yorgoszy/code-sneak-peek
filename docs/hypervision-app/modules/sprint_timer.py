"""
Sprint Timer Module
Virtual gate lines on camera view - detects when athlete crosses them.
Multi-split support (10m, 20m, 30m).
"""
import time


class SprintTimer:
    # MediaPipe: Nose = 0
    NOSE = 0

    def __init__(self, fps: int = 30):
        self.fps = fps
        self.reset()

    def reset(self):
        self.gates = []  # List of {"x": float, "label": str}
        self.gate_times = {}  # gate_index → timestamp
        self.start_time = None
        self.is_timing = False
        self.frame_count = 0
        self.last_nose_x = None

    def set_gates(self, gates: list):
        """
        Set virtual gate positions.
        gates: [{"x": 0.2, "label": "Start"}, {"x": 0.5, "label": "10m"}, {"x": 0.8, "label": "20m"}]
        x is normalized (0-1) across frame width
        """
        self.gates = sorted(gates, key=lambda g: g["x"])
        self.gate_times = {}
        print(f"🏃 {len(self.gates)} gates set: {[g['label'] for g in self.gates]}")

    def process_frame(self, landmarks):
        """Process frame for gate crossing detection"""
        self.frame_count += 1

        if landmarks is None or not self.gates:
            return {"status": "waiting", "frame": self.frame_count}

        nose = landmarks[self.NOSE]
        nose_x = nose[0]
        current_time = time.time()

        result = {
            "status": "tracking",
            "frame": self.frame_count,
            "nose_x": round(nose_x, 4),
            "splits": {},
        }

        # Check each gate for crossing
        for i, gate in enumerate(self.gates):
            if i in self.gate_times:
                continue  # Already crossed

            # Detect crossing: nose_x passes gate_x
            if self.last_nose_x is not None:
                if self.last_nose_x < gate["x"] <= nose_x or self.last_nose_x > gate["x"] >= nose_x:
                    self.gate_times[i] = current_time

                    if i == 0:
                        # Start gate
                        self.start_time = current_time
                        self.is_timing = True
                        result["status"] = "started"
                        print(f"🏃 START!")
                    else:
                        # Split gate
                        split_time = current_time - self.start_time if self.start_time else 0
                        result["splits"][gate["label"]] = round(split_time, 3)
                        print(f"⏱️ {gate['label']}: {split_time:.3f}s")

                        # Check if last gate
                        if i == len(self.gates) - 1:
                            result["status"] = "finished"
                            self.is_timing = False

        self.last_nose_x = nose_x

        # Add elapsed time if timing
        if self.is_timing and self.start_time:
            result["elapsed"] = round(current_time - self.start_time, 3)

        return result

    def get_results(self) -> dict:
        if not self.gate_times:
            return {"status": "no_data"}

        splits = {}
        for i, gate in enumerate(self.gates):
            if i in self.gate_times and i > 0 and self.start_time:
                splits[gate["label"]] = round(self.gate_times[i] - self.start_time, 3)

        return {
            "gates": [g["label"] for g in self.gates],
            "splits": splits,
            "total_time": max(splits.values()) if splits else 0,
            "fps": self.fps,
            "timing_accuracy_ms": round(1000 / self.fps, 1),
        }
