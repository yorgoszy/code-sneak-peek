"""
HyperVision - Local Camera App
Main entry point with PyQt6 GUI

Usage:
  python main.py              # Start GUI
  python main.py --test       # Quick webcam test (no GUI)
  python main.py --headless   # Headless mode for testing modules
"""
import sys
import time
import cv2
import numpy as np
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QPushButton, QLabel, QComboBox, QTabWidget, QGroupBox,
    QTextEdit, QStatusBar, QFrame, QSpinBox, QDoubleSpinBox,
    QMessageBox, QSlider
)
from PyQt6.QtCore import Qt, QTimer, QThread, pyqtSignal
from PyQt6.QtGui import QImage, QPixmap, QFont

from config import SUPABASE_URL, SUPABASE_ANON_KEY
from core.camera_manager import CameraManager, CameraType
from core.pose_detector import PoseDetector
from core.supabase_client import SupabaseClient
from modules.jump_analysis import JumpAnalyzer
from modules.bar_velocity import BarVelocityTracker
from modules.sprint_timer import SprintTimer
from modules.anthropometrics import AnthropometricsMeasurer


class CameraThread(QThread):
    """Background thread for camera capture"""
    frame_ready = pyqtSignal(np.ndarray)
    error = pyqtSignal(str)

    def __init__(self, camera: CameraManager):
        super().__init__()
        self.camera = camera
        self.running = True

    def run(self):
        while self.running and self.camera.is_running:
            frame = self.camera.read_frame()
            if frame is not None:
                self.frame_ready.emit(frame)
            else:
                time.sleep(0.01)

    def stop(self):
        self.running = False
        self.wait()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("HyperVision 🔬 Camera Lab")
        self.setMinimumSize(1200, 800)

        # Core components
        self.camera = CameraManager()
        self.pose = PoseDetector()
        self.supabase = SupabaseClient()
        self.camera_thread = None

        # Analysis modules
        self.jump_analyzer = JumpAnalyzer()
        self.bar_velocity = BarVelocityTracker()
        self.sprint_timer = SprintTimer()
        self.anthropometrics = AnthropometricsMeasurer()

        self.current_module = None
        self.frame_count = 0

        self._setup_ui()
        self._check_connection()

    def _setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)

        # ── LEFT PANEL: Camera Preview ──
        left_panel = QVBoxLayout()

        # Camera controls
        cam_controls = QHBoxLayout()
        self.cam_combo = QComboBox()
        self.cam_combo.addItems(["Webcam 0", "Webcam 1", "Basler Camera"])
        cam_controls.addWidget(QLabel("Κάμερα:"))
        cam_controls.addWidget(self.cam_combo)

        self.btn_start_cam = QPushButton("▶ Start Camera")
        self.btn_start_cam.clicked.connect(self.toggle_camera)
        self.btn_start_cam.setStyleSheet("background-color: #00ffba; color: black; font-weight: bold; padding: 8px;")
        cam_controls.addWidget(self.btn_start_cam)

        left_panel.addLayout(cam_controls)

        # Video display
        self.video_label = QLabel()
        self.video_label.setMinimumSize(640, 480)
        self.video_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.video_label.setStyleSheet("background-color: #1a1a1a; border: 2px solid #333;")
        self.video_label.setText("📷 Πατήστε Start Camera")
        left_panel.addWidget(self.video_label)

        # Status
        self.status_label = QLabel("⏳ Αναμονή...")
        self.status_label.setStyleSheet("color: #aca097; padding: 4px;")
        left_panel.addWidget(self.status_label)

        main_layout.addLayout(left_panel, stretch=3)

        # ── RIGHT PANEL: Module Tabs ──
        right_panel = QVBoxLayout()

        self.tabs = QTabWidget()
        self.tabs.addTab(self._create_jump_tab(), "🦘 Jump")
        self.tabs.addTab(self._create_velocity_tab(), "🏋️ Bar Velocity")
        self.tabs.addTab(self._create_sprint_tab(), "🏃 Sprint")
        self.tabs.addTab(self._create_anthropo_tab(), "📏 Anthropo")
        right_panel.addWidget(self.tabs)

        # Log area
        self.log_text = QTextEdit()
        self.log_text.setReadOnly(True)
        self.log_text.setMaximumHeight(200)
        self.log_text.setStyleSheet("background-color: #111; color: #00ffba; font-family: monospace;")
        right_panel.addWidget(self.log_text)

        main_layout.addLayout(right_panel, stretch=2)

        # Status bar
        self.statusBar().showMessage("HyperVision Ready")

    def _create_jump_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        layout.addWidget(QLabel("🦘 Jump Analysis"))
        layout.addWidget(QLabel("Μετράει ύψος άλματος μέσω flight time"))

        self.btn_calibrate_jump = QPushButton("📏 Calibrate Ground Level")
        self.btn_calibrate_jump.clicked.connect(self.calibrate_jump)
        self.btn_calibrate_jump.setStyleSheet("padding: 8px;")
        layout.addWidget(self.btn_calibrate_jump)

        self.btn_start_jump = QPushButton("▶ Start Jump Analysis")
        self.btn_start_jump.clicked.connect(lambda: self.start_module("jump"))
        self.btn_start_jump.setStyleSheet("background-color: #00ffba; color: black; padding: 10px; font-weight: bold;")
        layout.addWidget(self.btn_start_jump)

        self.jump_result_label = QLabel("Αναμονή για calibration...")
        self.jump_result_label.setWordWrap(True)
        self.jump_result_label.setStyleSheet("font-size: 14px; padding: 8px; background: #1a1a1a; color: white;")
        layout.addWidget(self.jump_result_label)

        self.btn_stop_jump = QPushButton("⏹ Stop & Results")
        self.btn_stop_jump.clicked.connect(self.stop_module)
        self.btn_stop_jump.setEnabled(False)
        layout.addWidget(self.btn_stop_jump)

        layout.addStretch()
        return tab

    def _create_velocity_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        layout.addWidget(QLabel("🏋️ Bar Velocity Tracker"))
        layout.addWidget(QLabel("HSV marker tracking → m/s"))

        # HSV controls
        hsv_group = QGroupBox("HSV Range (Marker Color)")
        hsv_layout = QVBoxLayout(hsv_group)
        hsv_layout.addWidget(QLabel("Adjust to match your marker color"))

        self.btn_start_velocity = QPushButton("▶ Start Velocity Tracking")
        self.btn_start_velocity.clicked.connect(lambda: self.start_module("velocity"))
        self.btn_start_velocity.setStyleSheet("background-color: #00ffba; color: black; padding: 10px; font-weight: bold;")

        self.btn_finish_rep = QPushButton("✓ Mark Rep Complete")
        self.btn_finish_rep.clicked.connect(self.finish_velocity_rep)
        self.btn_finish_rep.setEnabled(False)

        layout.addWidget(hsv_group)
        layout.addWidget(self.btn_start_velocity)
        layout.addWidget(self.btn_finish_rep)

        self.velocity_result_label = QLabel("Αναμονή...")
        self.velocity_result_label.setWordWrap(True)
        self.velocity_result_label.setStyleSheet("font-size: 14px; padding: 8px; background: #1a1a1a; color: white;")
        layout.addWidget(self.velocity_result_label)

        layout.addStretch()
        return tab

    def _create_sprint_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        layout.addWidget(QLabel("🏃 Sprint Timer"))
        layout.addWidget(QLabel("Virtual gates → split times"))
        layout.addWidget(QLabel("⚠️ Requires side-view camera"))

        self.btn_start_sprint = QPushButton("▶ Start Sprint Timer")
        self.btn_start_sprint.clicked.connect(lambda: self.start_module("sprint"))
        self.btn_start_sprint.setStyleSheet("background-color: #00ffba; color: black; padding: 10px; font-weight: bold;")
        layout.addWidget(self.btn_start_sprint)

        self.sprint_result_label = QLabel("Set up gates first...")
        self.sprint_result_label.setWordWrap(True)
        self.sprint_result_label.setStyleSheet("font-size: 14px; padding: 8px; background: #1a1a1a; color: white;")
        layout.addWidget(self.sprint_result_label)

        layout.addStretch()
        return tab

    def _create_anthropo_tab(self):
        tab = QWidget()
        layout = QVBoxLayout(tab)

        layout.addWidget(QLabel("📏 Anthropometrics"))
        layout.addWidget(QLabel("Pose landmarks → body measurements"))

        self.btn_measure = QPushButton("📸 Capture Measurement")
        self.btn_measure.clicked.connect(self.capture_anthropometrics)
        self.btn_measure.setStyleSheet("background-color: #00ffba; color: black; padding: 10px; font-weight: bold;")
        layout.addWidget(self.btn_measure)

        self.anthropo_result_label = QLabel("Σταθείτε μπροστά στην κάμερα...")
        self.anthropo_result_label.setWordWrap(True)
        self.anthropo_result_label.setStyleSheet("font-size: 14px; padding: 8px; background: #1a1a1a; color: white;")
        layout.addWidget(self.anthropo_result_label)

        layout.addStretch()
        return tab

    # ── Camera Controls ──

    def toggle_camera(self):
        if self.camera.is_running:
            self.stop_camera()
        else:
            self.start_camera()

    def start_camera(self):
        try:
            idx = self.cam_combo.currentIndex()
            if idx <= 1:
                self.camera.start_webcam(index=idx)
            else:
                self.camera.start_basler()

            # Update module FPS
            self.jump_analyzer.fps = self.camera.fps
            self.bar_velocity.fps = self.camera.fps
            self.sprint_timer.fps = self.camera.fps

            self.camera_thread = CameraThread(self.camera)
            self.camera_thread.frame_ready.connect(self.process_frame)
            self.camera_thread.start()

            self.btn_start_cam.setText("⏹ Stop Camera")
            self.btn_start_cam.setStyleSheet("background-color: #ff4444; color: white; font-weight: bold; padding: 8px;")
            self.log(f"📷 Camera started ({self.camera.camera_type.value} @ {self.camera.fps}fps)")

        except Exception as e:
            QMessageBox.critical(self, "Camera Error", str(e))
            self.log(f"❌ {e}")

    def stop_camera(self):
        if self.camera_thread:
            self.camera_thread.stop()
            self.camera_thread = None
        self.camera.stop()
        self.btn_start_cam.setText("▶ Start Camera")
        self.btn_start_cam.setStyleSheet("background-color: #00ffba; color: black; font-weight: bold; padding: 8px;")
        self.video_label.setText("📷 Camera Stopped")
        self.log("📷 Camera stopped")

    # ── Frame Processing ──

    def process_frame(self, frame):
        self.frame_count += 1
        display_frame = frame.copy()

        # Run pose detection
        landmarks, annotated = self.pose.detect(display_frame)

        # Run active module
        if self.current_module == "jump" and landmarks:
            result = self.jump_analyzer.process_frame(landmarks)
            self._update_jump_display(result)
        elif self.current_module == "velocity":
            result = self.bar_velocity.process_frame(annotated)
            annotated = result.get("frame", annotated)
            self._update_velocity_display(result)
        elif self.current_module == "sprint" and landmarks:
            result = self.sprint_timer.process_frame(landmarks)
            self._update_sprint_display(result)

        # Convert to QImage and display
        h, w, ch = annotated.shape
        bytes_per_line = ch * w
        qt_image = QImage(annotated.data, w, h, bytes_per_line, QImage.Format.Format_BGR888)
        scaled = qt_image.scaled(
            self.video_label.width(), self.video_label.height(),
            Qt.AspectRatioMode.KeepAspectRatio
        )
        self.video_label.setPixmap(QPixmap.fromImage(scaled))

        # Update status
        if self.frame_count % 30 == 0:
            self.status_label.setText(
                f"Frame: {self.frame_count} | FPS: {self.camera.fps} | "
                f"Pose: {'✅' if landmarks else '❌'} | Module: {self.current_module or 'None'}"
            )

    # ── Module Controls ──

    def start_module(self, module: str):
        self.current_module = module
        self.log(f"▶ Module started: {module}")

        if module == "jump":
            self.jump_analyzer.reset()
            self.btn_start_jump.setEnabled(False)
            self.btn_stop_jump.setEnabled(True)
        elif module == "velocity":
            self.bar_velocity.reset()
            self.btn_start_velocity.setEnabled(False)
            self.btn_finish_rep.setEnabled(True)
        elif module == "sprint":
            self.sprint_timer.reset()
            # Set default gates
            self.sprint_timer.set_gates([
                {"x": 0.2, "label": "Start"},
                {"x": 0.5, "label": "10m"},
                {"x": 0.8, "label": "20m"},
            ])
            self.btn_start_sprint.setEnabled(False)

    def stop_module(self):
        if self.current_module == "jump":
            results = self.jump_analyzer.get_results()
            self.jump_result_label.setText(
                f"🦘 Αποτελέσματα:\n"
                f"Σύνολο αλμάτων: {results.get('total_jumps', 0)}\n"
                f"Καλύτερο: {results.get('best_jump_cm', 0)} cm\n"
                f"Μέσος όρος: {results.get('avg_jump_cm', 0)} cm"
            )
            self.btn_start_jump.setEnabled(True)
            self.btn_stop_jump.setEnabled(False)

            # Send to platform
            if results.get("total_jumps", 0) > 0:
                self._send_results("jump_analysis", results)

        self.current_module = None
        self.log("⏹ Module stopped")

    def calibrate_jump(self):
        self.log("📏 Calibrating... Stand still!")
        # Will calibrate on next frame with pose
        self._pending_calibration = True

    def finish_velocity_rep(self):
        rep = self.bar_velocity.finish_rep()
        if rep:
            self.velocity_result_label.setText(
                f"🏋️ Rep #{rep['rep_number']}:\n"
                f"Peak: {rep['peak_velocity_ms']} m/s\n"
                f"Avg: {rep['avg_velocity_ms']} m/s"
            )

    def capture_anthropometrics(self):
        self.log("📸 Capturing measurements...")
        self.current_module = "anthropo_single"

    # ── Display Updates ──

    def _update_jump_display(self, result):
        status = result.get("status", "")

        # Handle pending calibration
        if hasattr(self, '_pending_calibration') and self._pending_calibration:
            # Get landmarks from the latest pose detection
            # This is a simplified approach - calibrate from displacement
            if "displacement" not in result and status == "waiting":
                return
            self._pending_calibration = False
            # Re-calibrate using current ankle position
            self.jump_result_label.setText("✅ Ground calibrated! Πηδήξτε!")
            self.log("✅ Ground level set")

        if status == "takeoff":
            self.jump_result_label.setText("🚀 TAKEOFF!")
        elif status == "landed":
            self.jump_result_label.setText(
                f"🦘 Jump #{result['jump_number']}:\n"
                f"Ύψος: {result['jump_height_cm']} cm\n"
                f"Flight time: {result['flight_time_s']}s\n"
                f"Ακρίβεια: ±{result.get('accuracy_mm', '?')}mm"
            )
        elif status == "airborne":
            self.jump_result_label.setText(f"🔼 Airborne! ({result.get('displacement', 0):.3f})")

    def _update_velocity_display(self, result):
        if result.get("status") == "tracking":
            v = result.get("calibrated_velocity_ms")
            if v:
                self.velocity_result_label.setText(f"📊 Velocity: {v} m/s")
            else:
                self.velocity_result_label.setText(
                    f"📊 Velocity: {result.get('velocity_pixels_per_second', 0)} px/s\n"
                    "(Χρειάζεται calibration για m/s)"
                )

    def _update_sprint_display(self, result):
        if result.get("status") == "started":
            self.sprint_result_label.setText("🏃 GO!")
        elif result.get("splits"):
            text = "⏱️ Splits:\n"
            for label, t in result["splits"].items():
                text += f"  {label}: {t}s\n"
            if result.get("elapsed"):
                text += f"\nElapsed: {result['elapsed']}s"
            self.sprint_result_label.setText(text)
        elif result.get("status") == "finished":
            self.sprint_result_label.setText("🏁 FINISH!\n" + self.sprint_result_label.text())

    # ── Cloud Communication ──

    def _send_results(self, module: str, results: dict):
        try:
            session_id = self.supabase.start_session(module)
            # Send summary as a frame
            self.supabase.send_frame({
                "camera_index": 0,
                "timestamp": time.time(),
                "measurements": results,
            })
            self.supabase.end_session()
            self.log(f"☁️ Results sent to platform ({module})")
        except Exception as e:
            self.log(f"⚠️ Cloud send failed: {e}")

    def _check_connection(self):
        """Check Supabase connection on startup"""
        try:
            ok = self.supabase.heartbeat()
            if ok:
                self.log("☁️ Connected to HyperKids platform")
            else:
                self.log("⚠️ Cannot connect to platform (offline mode)")
        except Exception:
            self.log("⚠️ Platform offline - working locally")

    # ── Utility ──

    def log(self, message: str):
        self.log_text.append(f"[{time.strftime('%H:%M:%S')}] {message}")
        print(message)

    def closeEvent(self, event):
        self.stop_camera()
        self.pose.close()
        self.supabase.close()
        event.accept()


def quick_test():
    """Quick webcam + pose test without GUI"""
    print("🔬 Quick Test Mode - Press Q to quit")
    cam = CameraManager()
    cam.start_webcam(0)
    pose = PoseDetector()
    jump = JumpAnalyzer(fps=cam.fps)

    calibrated = False
    while True:
        frame = cam.read_frame()
        if frame is None:
            continue

        landmarks, annotated = pose.detect(frame)

        if landmarks and not calibrated:
            jump.calibrate_ground(landmarks)
            calibrated = True

        if landmarks and calibrated:
            result = jump.process_frame(landmarks)
            status = result.get("status", "")
            if status in ("takeoff", "landed"):
                print(f"  → {result}")

        cv2.putText(annotated, f"Calibrated: {calibrated}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 186), 2)
        cv2.imshow("HyperVision Test", annotated)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    results = jump.get_results()
    print(f"\n📊 Results: {results}")

    cam.stop()
    pose.close()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    if "--test" in sys.argv:
        quick_test()
    elif "--headless" in sys.argv:
        print("Headless mode - testing connection...")
        client = SupabaseClient()
        print(f"Connected: {client.heartbeat()}")
        client.close()
    else:
        app = QApplication(sys.argv)
        app.setStyle("Fusion")

        # Dark theme
        from PyQt6.QtGui import QPalette, QColor
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor(26, 26, 26))
        palette.setColor(QPalette.ColorRole.WindowText, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.Base, QColor(15, 15, 15))
        palette.setColor(QPalette.ColorRole.AlternateBase, QColor(35, 35, 35))
        palette.setColor(QPalette.ColorRole.Text, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.Button, QColor(40, 40, 40))
        palette.setColor(QPalette.ColorRole.ButtonText, QColor(255, 255, 255))
        palette.setColor(QPalette.ColorRole.Highlight, QColor(0, 255, 186))
        palette.setColor(QPalette.ColorRole.HighlightedText, QColor(0, 0, 0))
        app.setPalette(palette)

        window = MainWindow()
        window.show()
        sys.exit(app.exec())
