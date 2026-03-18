# HyperVision 🔬 Local Camera App

Desktop εφαρμογή Python για σύνδεση καμερών (webcam ή Basler) με την πλατφόρμα HyperKids.

## ⚡ Quick Start (3 βήματα)

### 1. Setup
```bash
# Στο VS Code, άνοιξε τον φάκελο hypervision-app
cd docs/hypervision-app

# Δημιουργία virtual environment
python -m venv venv
source venv/bin/activate    # Mac/Linux
# venv\Scripts\activate     # Windows

# Εγκατάσταση dependencies
pip install -r requirements.txt
```

### 2. Configuration
```bash
# Αντέγραψε το .env
cp .env.example .env
# (Τα credentials είναι ήδη συμπληρωμένα)
```

### 3. Run
```bash
# GUI Mode (κανονική χρήση)
python main.py

# Quick Test (χωρίς GUI - webcam + jump analysis)
python main.py --test

# Headless (μόνο connection test)
python main.py --headless
```

## 📁 Δομή Αρχείων

```
hypervision-app/
├── main.py                  # Entry point - PyQt6 GUI
├── requirements.txt         # Python dependencies
├── config.py               # Supabase credentials & settings
├── .env.example            # Environment variables template
├── core/
│   ├── camera_manager.py   # Webcam + Basler camera abstraction
│   ├── pose_detector.py    # MediaPipe Pose wrapper
│   └── supabase_client.py  # camera-bridge Edge Function client
└── modules/
    ├── jump_analysis.py    # 🦘 Jump height via flight time
    ├── bar_velocity.py     # 🏋️ HSV marker → velocity m/s
    ├── sprint_timer.py     # 🏃 Virtual gates → split times
    └── anthropometrics.py  # 📏 Body measurements from pose
```

## 🎯 Modules

| Module | Webcam (30fps) | Basler (165fps) |
|--------|---------------|-----------------|
| 🦘 Jump Analysis | ±15mm accuracy | ±3mm accuracy |
| 🏋️ Bar Velocity | Basic tracking | ±0.01 m/s |
| 🏃 Sprint Timer | ±33ms timing | ±6ms timing |
| 📏 Anthropometrics | Screening only | Screening only |

## 🔌 Σύνδεση με Platform

Η app στέλνει **μόνο processed data** (JSON) στο Supabase μέσω `camera-bridge`:
- ✅ Ελάχιστο bandwidth
- ✅ Privacy (τα frames μένουν τοπικά)
- ✅ Real-time ταχύτητα

## 🎥 Basler Camera

Για χρήση Basler camera:
1. Εγκατάσταση [Pylon Suite](https://www.baslerweb.com/en/downloads/software-downloads/)
2. `pip install pypylon`
3. Επιλογή "Basler Camera" στο dropdown
