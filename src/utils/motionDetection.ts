/**
 * Motion Detection Utility για Sprint Timing
 * Ανιχνεύει κίνηση από το video stream της κάμερας
 */

export class MotionDetector {
  private videoElement: HTMLVideoElement;
  private canvas: HTMLCanvasElement;
  private context: CanvasRenderingContext2D;
  private previousFrame: ImageData | null = null;
  private threshold: number;
  private minMotionPixels: number;
  private isRunning: boolean = false;
  private animationFrameId: number | null = null;

  constructor(
    videoElement: HTMLVideoElement,
    threshold: number = 30,
    minMotionPixels: number = 2000
  ) {
    this.videoElement = videoElement;
    this.threshold = threshold;
    this.minMotionPixels = minMotionPixels;
    
    // Δημιουργία canvas για frame comparison
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d')!;
  }

  /**
   * Ξεκινάει την ανίχνευση κίνησης
   */
  start(onMotionDetected: () => void) {
    this.isRunning = true;
    this.canvas.width = this.videoElement.videoWidth;
    this.canvas.height = this.videoElement.videoHeight;
    
    const detectMotion = () => {
      if (!this.isRunning) return;

      this.context.drawImage(this.videoElement, 0, 0, this.canvas.width, this.canvas.height);
      const currentFrame = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);

      if (this.previousFrame) {
        const motionPixels = this.compareFrames(this.previousFrame, currentFrame);
        
        if (motionPixels > this.minMotionPixels) {
          console.log('🏃 Motion detected!', motionPixels, 'pixels changed');
          onMotionDetected();
        }
      }

      this.previousFrame = currentFrame;
      this.animationFrameId = requestAnimationFrame(detectMotion);
    };

    detectMotion();
  }

  /**
   * Σταματάει την ανίχνευση κίνησης
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.previousFrame = null;
  }

  /**
   * Συγκρίνει δύο frames και επιστρέφει τον αριθμό των pixels που άλλαξαν
   */
  private compareFrames(frame1: ImageData, frame2: ImageData): number {
    let motionPixels = 0;
    const data1 = frame1.data;
    const data2 = frame2.data;

    // Ελέγχουμε μόνο κάθε 4ο pixel για performance
    for (let i = 0; i < data1.length; i += 16) {
      const diff = Math.abs(data1[i] - data2[i]) +
                   Math.abs(data1[i + 1] - data2[i + 1]) +
                   Math.abs(data1[i + 2] - data2[i + 2]);
      
      if (diff > this.threshold) {
        motionPixels++;
      }
    }

    return motionPixels * 4; // Πολλαπλασιάζουμε επειδή ελέγχουμε 1 στα 4 pixels
  }

  /**
   * Ενημερώνει το threshold για την ευαισθησία
   */
  setThreshold(threshold: number) {
    this.threshold = threshold;
  }

  /**
   * Ενημερώνει τον minimum αριθμό pixels για motion detection
   */
  setMinMotionPixels(pixels: number) {
    this.minMotionPixels = pixels;
  }
}

/**
 * Δημιουργεί και αρχικοποιεί το camera stream
 */
export async function initializeCamera(
  videoElement: HTMLVideoElement,
  facingMode: 'user' | 'environment' = 'environment'
): Promise<MediaStream> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    videoElement.srcObject = stream;
    await videoElement.play();

    return stream;
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Δεν μπόρεσε να ξεκινήσει η κάμερα');
  }
}

/**
 * Σταματάει το camera stream
 */
export function stopCamera(stream: MediaStream) {
  stream.getTracks().forEach(track => track.stop());
}
