# Retina API Documentation

AI-powered retinal image analysis for diabetic retinopathy screening.

**Base URL:** `http://localhost:8080`

---

## Endpoints

### POST `/analyze`

Upload a retinal fundus image for AI diagnosis.

#### Request

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | `file` | Yes | Retinal fundus image (JPEG, PNG, BMP, TIFF) |

**Constraints:** Max 10MB, minimum 224x224px, must be valid retinal image.

#### Response (200 OK)

```json
{
  "filename": "retina_scan.jpg",
  "diagnosis": "Mild DR",
  "confidence": 0.874,
  "risk_level": "Moderate",
  "heatmap": "iVBORw0KGgo...base64_png",
  "observations": [
    {"label": "Optic Disc", "value": "Hemorrhages Possible"},
    {"label": "Vessels", "value": "Microaneurysms Detected"},
    {"label": "Macula", "value": "Exudates Likely"}
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | Uploaded filename |
| `diagnosis` | string | Healthy / Mild DR / Moderate DR / Severe DR / Proliferative DR |
| `confidence` | float | Model confidence (0.0-1.0) |
| `risk_level` | string | None / Low / Moderate / High / Critical |
| `heatmap` | string | Grad-CAM heatmap as base64 PNG |
| `observations` | array | Per-region anatomical findings |

#### Diagnosis Classes (APTOS)

| Class | Diagnosis | Risk |
|-------|-----------|------|
| 0 | Healthy | None |
| 1 | Mild DR | Low |
| 2 | Moderate DR | Moderate |
| 3 | Severe DR | High |
| 4 | Proliferative DR | Critical |

#### 400 — Validation Failed

```json
{"detail": "VALIDATION FAILED: Image too dark — possible underexposure"}
```

Validation errors: Image too dark, too bright, not retinal, low resolution, unsupported format.

---

## Architecture

- **Model:** EfficientNet-B0 with custom classifier (5-class)
- **Training:** APTOS 2019 Blindness Detection
- **Input:** 224x224 RGB fundus
- **Explainability:** Grad-CAM heatmap
- **Validation:** Format → Resolution → Brightness → Content check

---

## Examples

### cURL
```bash
curl -X POST http://localhost:8080/analyze -F "file=@retina.jpg"
```

### Python
```python
import requests
with open("retina.jpg", "rb") as f:
    r = requests.post("http://localhost:8080/analyze", files={"file": f})
print(r.json()["diagnosis"])
```

### JavaScript
```javascript
const fd = new FormData();
fd.append("file", fileInput.files[0]);
const { data } = await axios.post("http://localhost:8080/analyze", fd);
console.log(data.diagnosis);
```

---

## Deployment

```bash
# Docker
docker build -t retina-api backend/
docker run -p 8080:8080 retina-api

# Manual
cd backend && pip install -r requirements.txt && python main.py
```

## Limitations

- Diabetic retinopathy screening only (not glaucoma, AMD)
- 85-90% accuracy — NOT a clinical replacement
- Requires centered, well-lit fundus photos
