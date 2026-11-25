# ResearchLens – AI-Powered Research Paper Analysis

ResearchLens is an AI-powered web application designed to simplify research paper analysis and comparison. It extracts meaningful information from research papers, identifies key research components, and generates structured insights to help users understand and compare academic publications efficiently.

## 🚀 Features

- **PDF Upload:** Upload research papers in PDF format.
- **Automated Text Extraction:** Extract text from research papers using PyMuPDF.
- **AI-Powered Analysis:** Analyze research papers and identify important information.
- **Research Paper Comparison:** Compare multiple papers based on their algorithms, methodologies, datasets, performance, and limitations.
- **Research Gap Identification:** Identify potential research gaps from compared papers.
- **Paper Library:** Store, manage, search, and delete uploaded research papers.
- **Comparison History:** Save and revisit previous comparison reports.
- **Online Paper Discovery:** Discover research papers using the OpenAlex API.
- **Interactive Dashboard:** Access research papers, analysis results, and comparison features through a user-friendly interface.

## 🛠️ Tech Stack

| Component | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| AI Service | Python, FastAPI |
| PDF Processing | PyMuPDF |
| AI Integration | LiteLLM |
| Paper Discovery | OpenAlex API |

## 🏗️ Project Architecture

```text
ResearchLens/
│
├── frontend/          # React + TypeScript application
│
├── backend/           # Node.js + Express REST API
│
├── ai-service/        # Python FastAPI AI service
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

- Node.js and npm
- Python 3.11+
- MongoDB
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Ananya190705/ResearchLens.git
cd ResearchLens
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder and configure your environment variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
AI_SERVICE_URL=http://127.0.0.1:8001
```

Start the backend:

```bash
npm run dev
```

### 3. AI Service Setup

Open a new terminal:

```bash
cd ai-service
python -m venv venv
```

Activate the virtual environment.

**Windows:**

```powershell
.\venv\Scripts\Activate.ps1
```

Install the dependencies:

```bash
pip install -r requirements.txt
```

Configure the required AI provider credentials in the AI service environment configuration.

Start the FastAPI service:

```bash
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

API documentation:

http://127.0.0.1:8001/docs

### 4. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at:

http://localhost:5173

## 🔄 Application Workflow

1. Upload a research paper in PDF format.
2. Extract text from the uploaded document.
3. Generate an AI-powered analysis of the paper.
4. View extracted research information in the paper library.
5. Discover additional research papers online.
6. Select multiple papers for comparison.
7. Generate a structured comparison report.
8. Review similarities, differences, research gaps, and paper-wise comparisons.
9. Access previously saved comparison reports.

## 🎯 Project Objective

The main objective of ResearchLens is to reduce the manual effort involved in reviewing and comparing research papers by providing automated information extraction, AI-powered analysis, and structured research insights in a single platform.

## 👩‍💻 Developer

**Ananya G**

GitHub: [Ananya190705](https://github.com/Ananya190705)

---

*ResearchLens – Making Research Paper Analysis Smarter and Simpler.*
