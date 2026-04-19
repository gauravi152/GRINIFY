from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Request, Depends
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import torch
import torch.nn.functional as F
from model import get_model
from preprocessing import preprocess_image
from chatbot import get_chatbot_response
import os
import json
import uuid
import shutil
import logging
from datetime import datetime, timedelta
from jose import JWTError, jwt
import bcrypt

# ---------------- LOGGING ----------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ---------------- SECURITY ----------------
SECRET_KEY = "grinify_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

app = FastAPI(title="Grinify AI Backend")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# ---------------- CORS FIX (PRODUCTION READY FIXED) ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://grinify.netlify.app",
        "https://grinify.onrender.com"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- FILE STORAGE ----------------
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ---------------- MODELS ----------------
class ChatRequest(BaseModel):
    query: str

class AuthLoginRequest(BaseModel):
    email: str
    password: str

class AuthSignupRequest(BaseModel):
    name: str
    email: str
    password: str

class UpdateProfileRequest(BaseModel):
    name: str
    email: str
    location: str | None = None
    gender: str | None = None
    birthdate: str | None = None

# ---------------- DB ----------------
DB_PATH = os.path.join(os.path.dirname(__file__), "users.json")

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain, hashed):
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def load_db():
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "r") as f:
            return json.load(f)
    return {"users": {}, "sessions": {}}

def save_db(db):
    with open(DB_PATH, "w") as f:
        json.dump(db, f, indent=4)

user_db = load_db()

# ---------------- AUTH ----------------
def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        if email not in user_db["users"]:
            raise HTTPException(status_code=401, detail="User not found")
        return user_db["users"][email]
    except:
        raise HTTPException(status_code=401, detail="Invalid token")

# ---------------- ROOT ----------------
@app.get("/")
def root():
    return {"message": "Grinify backend running"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/wake")
def wake():
    return {"status": "awake"}

# ---------------- SIGNUP ----------------
@app.post("/auth/signup")
def signup(req: AuthSignupRequest):
    if req.email in user_db["users"]:
        return {"status": "error", "message": "User exists"}

    # FIXED BASE_URL (ENV READY)
    BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

    user_db["users"][req.email] = {
        "name": req.name,
        "email": req.email,
        "password": get_password_hash(req.password),
        "points": 0,
        "scans": 0,
        "rank": "Explorer",
        "avatar": f"{BASE_URL}/uploads/default.png",
        "history": []
    }

    token = create_access_token({"sub": req.email})
    save_db(user_db)

    return {"status": "success", "token": token, "user": user_db["users"][req.email]}

# ---------------- LOGIN ----------------
@app.post("/auth/login")
def login(req: AuthLoginRequest):
    if req.email not in user_db["users"]:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid credentials"})

    user = user_db["users"][req.email]

    if not verify_password(req.password, user["password"]):
        return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid credentials"})

    token = create_access_token({"sub": req.email})

    return {"status": "success", "token": token, "user": user}

# ---------------- PROFILE ----------------
@app.get("/user/profile")
def profile(user=Depends(get_current_user)):
    return {"status": "success", "user": user}

# ---------------- IMAGE UPLOAD ----------------
@app.post("/profile/upload-image")
def upload(file: UploadFile = File(...), user=Depends(get_current_user)):
    ext = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{ext}"
    path = os.path.join(UPLOAD_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")
    url = f"{BASE_URL}/uploads/{filename}"

    user["avatar"] = url
    save_db(user_db)

    return {"status": "success", "avatar": url}

# ---------------- MODEL ----------------
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

model = get_model(num_classes=6)
model.eval()

@app.post("/predict")
async def predict(file: UploadFile = File(...), user=Depends(get_current_user)):
    image_bytes = await file.read()
    input_tensor = preprocess_image(image_bytes).to(device)

    with torch.no_grad():
        output = model(input_tensor)
        prob = F.softmax(output, dim=1)
        conf, pred = torch.max(prob, 1)

    confidence = conf.item()
    category = str(pred.item())

    points = 20
    user["points"] += points
    user["scans"] += 1

    user["history"].append({
        "date": str(datetime.utcnow()),
        "category": category,
        "points": points
    })

    save_db(user_db)

    return {
        "status": "success",
        "category": category,
        "confidence": confidence,
        "points": points
    }

# ---------------- CHAT ----------------
@app.post("/chat")
def chat(req: ChatRequest):
    return {"status": "success", "response": get_chatbot_response(req.query)}

# ---------------- LEADERBOARD ----------------
@app.get("/leaderboard")
def leaderboard():
    users = []

    for u in user_db["users"].values():
        users.append({
            "name": u["name"],
            "points": u["points"],
            "scans": u["scans"],
            "avatar": u["avatar"],
            "impact_level": u["rank"]
        })

    users.sort(key=lambda x: x["points"], reverse=True)

    for i, u in enumerate(users):
        u["rank"] = i + 1

    return {"status": "success", "leaderboard": users}