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
## ⚙️ Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/electro323/Receipt-Scanner.git
cd Receipt-Scanner
```

---

## Backend Setup (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

Backend will run on:

```text
http://localhost:3000
```

---

## Frontend Setup (Ionic)

Open a new terminal:

```bash
cd frontend
npm install
ionic serve
```

Frontend will run on:

```text
http://localhost:8100
```

##  Project Structure

```text
Receipt-Scanner/
├── frontend/
├── backend/
├── docs/
├── HLD.md
├── LLD.md
├── README.md
