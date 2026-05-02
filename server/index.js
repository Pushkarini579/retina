const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const Analysis = require('./models/Analysis');

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/retina_db';
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// 1. ANALYSIS ROUTE (Proxy to Python AI Service)
app.post('/api/analyze', upload.single('file'), async (req, res) => {
    try {
        console.log("STEP 1: Received analysis request");
        if (!req.file) {
            console.warn("STEP 1.1: No file in request");
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Forward to Python AI Service
        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://127.0.0.1:8080';
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        console.log(`STEP 2: Forwarding to Python AI Service at ${AI_SERVICE_URL}...`);
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/analyze`, formData, {
            headers: {
                ...formData.getHeaders()
            }
        });

        console.log("STEP 3: AI response status =", aiResponse.status);

        const result = aiResponse.data;
        console.log("STEP 4: AI result =", JSON.stringify(result, null, 2));

        // Save to MongoDB
        const newRecord = new Analysis({
            patientName: req.body.patientName || "Anonymous",
            filename: req.file.originalname,
            imagePath: req.file.path,
            diagnosis: result.diagnosis,
            confidence: result.confidence,
            riskLevel: result.risk_level,
            heatmap: result.heatmap,
            observations: result.observations
        });

        console.log("STEP 5: Saving to MongoDB...");
        await newRecord.save();
        console.log("STEP 6: Saved successfully with ID:", newRecord._id);

        res.json(newRecord);

    } catch (error) {
        console.error("FINAL ERROR:", error);
        res.status(500).json({ 
            error: error.message,
            detail: "Consult backend logs for STEP-by-STEP breakdown"
        });
    }
});

// 2. HISTORY ROUTE
app.get('/api/history', async (req, res) => {
    try {
        const history = await Analysis.find().sort({ createdAt: -1 });
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch history' });
    }
});

// 3. PDF REPORT ROUTE
app.get('/api/report/:id', async (req, res) => {
    try {
        const record = await Analysis.findById(req.params.id);
        if (!record) return res.status(404).json({ error: 'Report not found' });

        const doc = new PDFDocument({ margin: 50 });
        
        // HTTP Headers for PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Healthway_Report_${record._id}.pdf`);
        
        doc.pipe(res);

        // Header
        doc.fillColor('#2e7d32').fontSize(26).text('HEALTHWAY DIAGNOSTICS', { align: 'center' });
        doc.fontSize(10).fillColor('#666666').text('Advanced Ocular Imaging & Neural Analysis', { align: 'center' });
        doc.moveDown(2);
        
        doc.strokeColor('#eeeeee').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(2);

        // Patient Details
        doc.fillColor('#333333').fontSize(14).text(`Patient Name: `, { continued: true }).font('Helvetica-Bold').text(record.patientName);
        doc.font('Helvetica').fontSize(12).text(`Report ID: ${record._id}`);
        doc.text(`Date & Time: ${new Date(record.createdAt).toLocaleString()}`);
        doc.moveDown(2);

        // Scan Image
        if (record.imagePath && fs.existsSync(record.imagePath)) {
            doc.fontSize(14).font('Helvetica-Bold').text('Retina Scan Imagery');
            doc.moveDown(0.5);
            doc.image(record.imagePath, {
                fit: [500, 300],
                align: 'center',
                valign: 'center'
            });
            doc.moveDown(1);
        }

        // Analysis Results
        doc.addPage();
        doc.fontSize(20).fillColor('#2e7d32').text('Diagnostic Summary', { underline: true });
        doc.moveDown(1);

        const diagnosisColor = record.diagnosis === 'Healthy' ? '#2e7d32' : '#d32f2f';
        
        doc.fontSize(16).fillColor('#333333').text('Clinical Diagnosis: ', { continued: true })
           .fillColor(diagnosisColor).font('Helvetica-Bold').text(record.diagnosis);
        
        doc.moveDown(0.5);
        doc.font('Helvetica').fillColor('#333333').fontSize(14).text(`Confidence Score: ${record.confidence}%`);
        doc.text(`Severity Risk Level: ${record.riskLevel}`);
        doc.moveDown(2);

        // Observations
        doc.fontSize(16).font('Helvetica-Bold').text('Technical Observations');
        doc.moveDown(0.5);
        
        record.observations.forEach(obs => {
            doc.fontSize(12).font('Helvetica-Bold').text(`${obs.label}: `, { continued: true })
               .font('Helvetica').text(obs.value);
            doc.moveDown(0.2);
        });

        doc.moveDown(2);

        // Recommendations
        doc.fontSize(16).font('Helvetica-Bold').text('Clinical Recommendations');
        doc.moveDown(0.5);
        doc.fontSize(12).font('Helvetica').fillColor('#555555');
        
        if (record.riskLevel === 'Low') {
            doc.text('• No immediate pathological markers detected.');
            doc.text('• Continue with annual preventative screenings.');
            doc.text('• Maintain standard vascular health monitoring.');
        } else {
            doc.text('• Potential pathological markers identified.');
            doc.text('• Urgent consultation with a Retinal Specialist is recommended.');
            doc.text('• Additional OCT or Fluorescein Angiography may be required.');
        }

        doc.moveDown(4);
        
        // Footer
        doc.fontSize(10).fillColor('#999999').text('This report is generated by an AI diagnostic system and should be reviewed by a certified medical professional.', { align: 'center', italic: true });

        doc.end();

    } catch (error) {
        console.error('PDF Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Gateway Server running on port ${PORT}`));
