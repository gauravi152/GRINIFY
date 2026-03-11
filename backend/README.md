# Grinify AI Backend 🌍🤖

This is the Python-based AI backend for the Grinify waste classification system. It uses **FastAPI** for the web server and **PyTorch** for the CNN-based AI model.

## 📂 Project Structure
- `app.py`: Main FastAPI application with `/predict` and `/chat` endpoints.
- `model.py`: WasteCNN architecture definition.
- `preprocessing.py`: Image transformation pipeline.
- `chatbot.py`: Modular rule-based AI assistant.
- `train.py`: Genuine script for training the model on the TrashNet dataset.
- `requirements.txt`: Python dependencies.

## 🛠️ Setup Instructions

### 1. Install Dependencies
Ensure you have Python 3.8+ installed. Run:
```bash
pip install -r requirements.txt
```

### 2. Prepare the Dataset (Optional for training)
To train the model genuinely, download the **TrashNet** dataset (or similar) and place it in a `backend/data` folder. The folder structure should be:
```
data/
  glass/
  metal/
  paper/
  plastic/
  organic/
```

### 3. Train the Model
Run the training script to generate `waste_model.pth`:
```bash
python train.py
```
*Note: This script performs image resizing, augmentation, and normalization automatically.*

### 4. Run the Backend
Start the FastAPI server:
```bash
python app.py
```
*The server will start on `http://localhost:8000`*

## 🚀 API Endpoints

### `POST /predict`
- **Payload**: Image file (Multipart/form-data)
- **Response**:
  ```json
  {
    "status": "success",
    "category": "Plastic",
    "confidence": 98.5,
    "instructions": "Rinse thoroughly and place in the yellow bin.",
    "points": 10
  }
  ```

### `POST /chat`
- **Payload**: `query` (Form field)
- **Response**:
  ```json
  {
    "status": "success",
    "response": "♻️ Most plastics (PET, HDPE) are recyclable. Rinse them thoroughly."
  }
  ```

## ✅ Technology Stack
- **Framework**: FastAPI
- **AI Library**: PyTorch / Torchvision
- **Image Processing**: Pillow
- **Server**: Uvicorn
