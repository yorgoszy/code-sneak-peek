# HyperVision — Local Camera App
# Τοπική εφαρμογή για σύνδεση καμερών με την πλατφόρμα HyperKids

## Εγκατάσταση

```bash
# Δημιουργία virtual environment
python -m venv venv
source venv/bin/activate  # Mac/Linux
# venv\Scripts\activate   # Windows

# Εγκατάσταση dependencies
pip install -r requirements.txt
```

## Δομή Project

```
hypervision/
├── main.py                  # Entry point - PyQt6 GUI
├── requirements.txt         # Python dependencies
├── config.py               # Supabase URL, API key config
├── core/
│   ├── camera_manager.py   # Basler Pylon + USB webcam abstraction
│   ├── frame_pipeline.py   # OpenCV processing pipeline
│   └── supabase_client.py  # REST API client → camera-bridge edge function
├── modules/
│   ├── fight_analysis.py   # 🥊 Strike detection + pose → Gemini
│   ├── jump_analysis.py    # 🦘 Flight time → jump height/distance
│   ├── bar_velocity.py     # 🏋️ HSV marker → velocity m/s
│   ├── sprint_timer.py     # 🏃 Virtual gates → split times
│   └── anthropometrics.py  # 📏 Pose landmarks → body measurements
└── ui/
    ├── main_window.py      # Main app window with module tabs
    ├── camera_preview.py   # Live camera feed widget
    ├── fight_panel.py      # Fight analysis controls
    ├── training_panel.py   # VBT/Jump/Sprint controls
    └── settings_dialog.py  # Camera & connection settings
```

## Τεχνολογίες

| Package | Χρήση |
|---------|-------|
| **PyQt6** | Desktop GUI (cross-platform Mac/Windows) |
| **opencv-python** | Frame capture, processing, color tracking |
| **mediapipe** | Pose estimation (33 landmarks) |
| **pypylon** | Basler camera SDK (165fps Global Shutter) |
| **httpx** | Async HTTP client → Supabase Edge Functions |
| **numpy** | Numerical computations |

## Σύνδεση με Platform

Η εφαρμογή επικοινωνεί με τo Supabase μέσω του `camera-bridge` Edge Function:

```
POST https://dicwdviufetibnafzipa.supabase.co/functions/v1/camera-bridge
Headers:
  Content-Type: application/json
  apikey: <SUPABASE_ANON_KEY>
```

### API Actions:

| Action | Περιγραφή |
|--------|-----------|
| `start_session` | Ξεκινά νέα session ανάλυσης |
| `send_frame` | Στέλνει processed frame data (pose, detections) |
| `send_batch` | Στέλνει πολλαπλά frames μαζί |
| `end_session` | Κλείνει τη session |
| `heartbeat` | Health check |

### Σημαντικό: ΔΕΝ στέλνουμε raw pixels!

Η Python app κάνει τοπικά:
1. Capture frame (Basler/webcam)
2. MediaPipe pose estimation → 33 landmarks
3. OpenCV object detection / HSV tracking
4. Στέλνει ΜΟΝΟ τα processed data (landmarks, bboxes, measurements)

Αυτό σημαίνει:
- ✅ Ελάχιστο bandwidth (JSON, όχι εικόνες)
- ✅ Real-time ταχύτητα
- ✅ Δουλεύει και με αργό internet
- ✅ Privacy (τα frames μένουν τοπικά)

## Modules

### 🥊 Fight Analysis (fight_analysis.py)
- Basler cameras 165fps
- MediaPipe pose → fighter positions
- Strike detection via pose velocity
- Sends to Gemini 3.1 Pro for verification
- Stores results in `ai_training_labels` table

### 🦘 Jump Analysis (jump_analysis.py)
- Tracks ankle landmarks frame-by-frame
- Calculates flight time (takeoff → landing)
- Jump height = ½ × g × t²
- 165fps = ±3mm accuracy (vs 30fps webcam ±15mm)
- Saves to `ai_coach_test_results` table

### 🏋️ Bar Velocity (bar_velocity.py)
- HSV color marker tracking on barbell
- Pixel displacement → calibrated m/s
- With Basler 165fps: velocity accuracy ±0.01 m/s
- Real-time estimated 1RM calculation
- Saves to strength test tables

### 🏃 Sprint Timer (sprint_timer.py)
- Virtual gate lines on camera view
- Pose landmark crossing detection
- Multi-split support (10m, 20m, 30m)
- 165fps = ±6ms timing accuracy

### 📏 Anthropometrics (anthropometrics.py)
- Reference object calibration (known size)
- Pose landmarks → segment lengths
- Calculates: height, arm span, leg length ratios
- Less accurate than manual but useful for screening
