#  AI Receipt Scanner

An AI-powered receipt scanning system that extracts structured data from receipt images using OCR and Large Language Models.

The system automates receipt processing by converting images into structured financial data.

---

##  Project Overview

The AI Receipt Scanner allows users to:

- Upload receipt images (camera or file)
- Extract raw text using OCR (Tesseract)
- Convert OCR text into structured JSON using AI (Llama 3.1)
- Detect duplicate receipts
- Store processed receipts in a database
- View structured receipt data

---

##  Tech Stack

### Frontend
- Ionic Framework

### Backend
- NestJS (Node.js)

### OCR Engine
- Tesseract OCR

### AI Model
- Llama 3.1

### Database
- MongoDB

---

##  Project Structure

```text
Receipt-Scanner/
├── frontend/
├── backend/
├── docs/
├── HLD.md
├── LLD.md
├── README.md