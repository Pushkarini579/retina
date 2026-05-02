# Healthway Diagnostics - Neural Retina Analysis

**Live Demo:** [https://retina-25s2.vercel.app](https://retina-25s2.vercel.app)

Healthway Diagnostics is a professional-grade clinical platform that leverages deep learning to detect Diabetic Retinopathy (DR) from fundus photography (retina scans). Using an **EfficientNet-B0** neural engine, it provides instant diagnostic classification and visual "heatmaps" (Grad-CAM) to assist medical professionals.

---

## 🏗️ Architecture
The system operates on a three-tier architecture:
1.  **AI Engine (Python/FastAPI):** High-performance inference server using PyTorch.
2.  **Clinical Gateway (Node.js/Express):** Middleware handling patient records, file storage (Multer), and PDF report generation (PDFKit).
3.  **Diagnostic Portal (Next.js/TypeScript):** A modern, clinical-grade interface with real-time analysis status and history tracking.

---

## ✨ Key Features
- **Neural Diagnosis:** Classifies scans into 5 stages: Healthy, Mild, Moderate, Severe, or Proliferative DR.
- **Explainable AI (XAI):** Generates Grad-CAM heatmaps to highlight pathological markers (Hemorrhages, Exudates, etc.).
- **Clinical Reports:** Generates professional PDF diagnostic reports for patients.
- **History Management:** Securely stores and retrieves past patient analyses using MongoDB.
- **Image Validation:** Automated biological texture checking to prevent non-retinal uploads.

---

## 🛠️ Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, SweetAlert2.
- **Middleware:** Node.js, Express, MongoDB (Mongoose), PDFKit.
- **AI Backend:** Python 3.10+, FastAPI, PyTorch, Torchvision, OpenCV.

---

## 🚀 Local Setup

### 1. Neural Engine (AI Service)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```
*Runs on `http://127.0.0.1:8080`*

### 2. Clinical Gateway (Middleware)
```bash
cd server
npm install
# Create a .env file with:
# MONGO_URI=your_mongodb_uri
# AI_SERVICE_URL=http://127.0.0.1:8080
node index.js
```
*Runs on `http://127.0.0.1:5000`*

### 3. Diagnostic Portal (Frontend)
```bash
npm install
# Create a .env.local file with:
# NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
npm run dev
```
*Runs on `http://127.0.0.1:3000`*

---

## 🌐 Deployment
This project is pre-configured for deployment on **Vercel** (Frontend) and **Render/Railway** (Backend & Middleware).

1.  **Frontend:** Deploy the root directory to Vercel. Set `NEXT_PUBLIC_API_URL`.
2.  **Middleware:** Deploy the `/server` folder. Set `MONGO_URI` and `AI_SERVICE_URL`.
3.  **AI Service:** Deploy the `/backend` folder. No extra config required.

---

## ⚠️ Disclaimer
**This software is for educational/research purposes only.** It is not a certified medical device. The diagnostic results provided by the neural engine should always be reviewed by a certified ophthalmologist or medical professional.

---

## 📄 License
Distributed under the ISC License. See `LICENSE` for more information.
