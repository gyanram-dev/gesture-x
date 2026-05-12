# EmotionX

> Real-Time AI-Powered Facial Emotion Detection System

**EmotionX** is a modern, real-time facial emotion recognition application that uses your webcam and deep learning models to detect and visualize human emotions as you express them.

---

## Overview

EmotionX leverages computer vision and neural networks to analyze facial expressions in real time through your webcam. Built with React, Vite, and [face-api.js](https://github.com/vladmandic/face-api), it runs entirely in the browser — no backend required.

## Demo

Open the app in your browser, grant webcam access, and the AI will detect your facial expressions in real time. Bounding boxes highlight detected faces, and emotion labels update live above each face. A panel in the bottom-right corner shows all emotion probabilities with confidence scores.

## Features

- **Real-Time Detection** — Processes webcam feed continuously at smooth frame rates
- **7 Emotion Classes** — Detects happy, sad, angry, surprised, fearful, disgusted, and neutral expressions
- **Face Bounding Boxes** — Draws colored boxes around detected faces
- **Emotion Labels** — Shows dominant emotion with confidence percentage above each face
- **Live Probability Panel** — Displays all emotion scores as animated progress bars
- **Clean Dark UI** — Fullscreen webcam feed with minimal, modern overlay
- **Model Loading States** — Clear feedback during AI model initialization
- **Error Handling** — Graceful handling of camera permission denial and model loading failures
- **Responsive Design** — Works across desktop and different viewport sizes

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | React 19 |
| Build Tool | Vite |
| AI / ML | face-api.js (@vladmandic/face-api) |
| Neural Networks | TinyFaceDetector + FaceExpressionNet (TensorFlow.js) |
| Styling | Inline CSS (no external UI library) |
| Language | JavaScript (ES Modules) |
| Linting | ESLint |

### Key Concepts

- **Computer Vision** — Using CNN-based models for face detection and expression classification
- **Transfer Learning** — Pre-trained models fine-tuned on large facial expression datasets
- **Real-Time Inference** — Browser-based ML using TensorFlow.js with WebGL acceleration
- **Canvas API** — Overlay rendering for bounding boxes and emotion labels

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd EmotionX

# Install dependencies
npm install
```

## Run Locally

```bash
# Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Camera/          # Webcam video renderer
│   ├── EmotionCard/     # Emotion probability panel
│   └── EmotionOverlay/ # Canvas overlay (bounding boxes + labels)
├── hooks/
│   ├── useCamera/           # Webcam access hook
│   └── useEmotionDetection/ # face-api.js detection hook
├── pages/
│   └── HomePage/       # Main application page
├── App.jsx             # Root component
└── main.jsx            # Entry point
public/
└── models/             # face-api.js model weights
    ├── tiny_face_detector_model/
    └── face_expression_model/
```

### Architecture Highlights

- **Custom Hooks** — `useCamera` and `useEmotionDetection` encapsulate all webcam and AI logic
- **Separation of Concerns** — Camera rendering, detection, and overlay rendering are fully decoupled
- **Single RAF Loop** — Efficient animation loop for continuous detection
- **One-Time Initialization** — AI models load once and persist throughout the session
- **Stable React Hooks** — All hooks follow the Rules of Hooks with stable dependencies

## Screenshots

> **Screenshot 1** — Model initialization screen  
> **Screenshot 2** — Live emotion detection with bounding boxes  
> **Screenshot 3** — Emotion probability panel showing all classes

_(Add screenshots to a `screenshots/` folder and reference them here)_

## Future Improvements

- [ ] Multi-face detection with per-face emotion cards
- [ ] Emotion history timeline / trend visualization
- [ ] Screenshot capture of detected emotions
- [ ] Emotion logging with timestamp export (CSV/JSON)
- [ ] Audio feedback for emotion changes
- [ ] Support for video file input alongside webcam
- [ ] Backend API for cloud-based emotion analysis
- [ ] Mobile responsiveness optimization
- [ ] WebSocket integration for remote emotion monitoring

## Learning Outcomes

Through building EmotionX, the following concepts were implemented in a production-ready web application:

1. **Webcam Access** — Using `navigator.mediaDevices.getUserMedia` for camera streaming
2. **Canvas Overlay Rendering** — Drawing bounding boxes and text labels aligned with video
3. **Browser-Based ML** — Loading and running pre-trained CNN models via TensorFlow.js
4. **Real-Time Video Processing** — Continuous frame analysis using `requestAnimationFrame`
5. **React Custom Hooks** — Encapsulating webcam and AI logic into reusable hooks
6. **React Component Architecture** — Modular UI with separated Camera, Overlay, and Card components
7. **Error State Handling** — Graceful degradation for camera denial and model failures
8. **Performance Optimization** — Avoiding repeated initialization, memory leaks, and React hook violations

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

MIT License — see the LICENSE file for details.