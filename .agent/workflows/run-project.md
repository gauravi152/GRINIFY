---
description: how to run the Grinify application (backend & frontend)
---

To run the full Grinify application, you need to start both the Python backend and the React frontend.

### 1. Start the Backend (Python/FastAPI)
The backend handles AI predictions, the chatbot, and user profile persistence.

**Installation (First time only):**
```powershell
pip install -r backend/requirements.txt
```

**Running the server:**
```powershell
python backend/app.py
```
*The backend will run on `http://127.0.0.1:8000`.*

---

### 2. Start the Frontend (Vite/React)
The frontend is the main user interface.

**Installation (First time only):**
```powershell
npm install
```

**Running the development server:**
```powershell
npm run dev
```
*The frontend will run on `http://localhost:5173`.*

---

### ⚠️ Common Issues
- **Port Conflict**: If port 8000 is taken, the backend might fail to start. 
- **Python Version**: Ensure you are using Python 3.8 or higher.
- **Model Weights**: The backend will attempt to load `backend/waste_model.pth`. If not found, it will run in "random weight" demo mode.
