from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, Request
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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = "grinify_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

app = FastAPI(title="Grinify AI Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5176",
        "http://localhost:5177",
        "http://127.0.0.1:5177",
        "http://localhost:5178",
        "http://127.0.0.1:5178",
        "http://localhost:5179",
        "http://127.0.0.1:5179",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

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

# File-based Persistence logic
DB_PATH = os.path.join(os.path.dirname(__file__), "users.json")

def get_password_hash(password):
    # bcrypt requires bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password, hashed_password):
    pwd_bytes = plain_password.encode('utf-8')
    hashed_pwd_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(pwd_bytes, hashed_pwd_bytes)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_initial_user(name, email, password):
    return {
        "name": name,
        "email": email,
        "password": get_password_hash(password),
        "location": "Earth",
        "gender": "Not Specified",
        "birthdate": "2000-01-01",
        "points": 1240,
        "scans": 42,
        "rank": "Gold Explorer",
        "history": [
            {"date": "2024-03-20", "item": "Plastic Bottle", "points": 10},
            {"date": "2024-03-19", "item": "Paper Box", "points": 5},
            {"date": "2024-03-18", "item": "Metal Can", "points": 10}
        ],
        "avatar": f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=8A9A5B&color=fff"
    }

def load_db():
    default_db = {
        "users": {},
        "sessions": {} # token -> email mapping
    }
    if os.path.exists(DB_PATH):
        try:
            with open(DB_PATH, 'r') as f:
                data = json.load(f)
                # Migration logic
                if "users" not in data:
                    data = {"users": {}, "sessions": {}}
                
                # If old single-session format exists, migrate it
                if "session" in data:
                    if data["session"].get("token") and data["session"].get("email"):
                        data["sessions"][data["session"]["token"]] = data["session"]["email"]
                    del data["session"]
                
                if "sessions" not in data:
                    data["sessions"] = {}
                    
                return data
        except Exception as e:
            print(f"Error loading users.json: {e}")
            return default_db
    return default_db

def save_db(db):
    try:
        with open(DB_PATH, 'w') as f:
            json.dump(db, f, indent=4)
    except Exception as e:
        print(f"Error saving to users.json: {e}")

# Global database instance
user_db = load_db()

def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            return None
    except JWTError:
        return None

    if email not in user_db["users"]:
        return None
        
    return user_db["users"][email]

@app.get("/debug/db")
def debug_db():
    return user_db


# Device Configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Initialize ResNet18 model
model = get_model(num_classes=6)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "waste_model.pth")
MAPPING_PATH = os.path.join(os.path.dirname(__file__), "class_mapping.json")

# Load Class Mapping
class_mapping = {}
if os.path.exists(MAPPING_PATH):
    try:
        with open(MAPPING_PATH, 'r') as f:
            class_mapping = json.load(f)
        logger.info(f"Loaded class mapping from {MAPPING_PATH}")
    except Exception as e:
        logger.error(f"Failed to load class mapping: {e}")

if os.path.exists(MODEL_PATH):
    try:
        model.load_state_dict(torch.load(MODEL_PATH, map_location=device))
        logger.info(f"Loaded model weights from {MODEL_PATH}")
    except Exception as e:
        logger.error(f"Failed to load model weights: {e}")
else:
    logger.warning(f"No model weights found at {MODEL_PATH}, using uninitialized model.")

model.to(device)
model.eval()

# We no longer need imagenet_class_index.json or map_imagenet_to_waste()

@app.get("/")
def read_root():
    return {"message": "Grinify AI Backend is running!"}

@app.get("/user/data")
@app.get("/user/profile")
async def get_user_data(request: Request):
    user = get_current_user(request)
    if not user:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Not authenticated"})
    
    return {
        "status": "success",
        "user": user
    }

@app.post("/auth/signup")
async def auth_signup(request: AuthSignupRequest):
    try:
        email = request.email
        if email in user_db["users"]:
            logger.warning(f"Signup failed: Email {email} already registered")
            return JSONResponse(status_code=400, content={"status": "error", "message": "Email already registered"})
        
        user_db["users"][email] = get_initial_user(request.name, email, request.password)
        
        # Create new session (JWT)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        
        save_db(user_db)
        logger.info(f"User signup successful: {email}")
        return {
            "status": "success",
            "token": token,
            "user": user_db["users"][email]
        }
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/auth/login")
async def auth_login(request: AuthLoginRequest):
    try:
        email = request.email
        password = request.password
        
        if email not in user_db["users"]:
            logger.warning(f"Login failed: Invalid email {email}")
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid email or password"})
        
        user = user_db["users"][email]
        stored_password = user.get("password")
        
        # Handle cases where users in users.json might not have hashed passwords yet (legacy)
        is_valid = False
        if stored_password:
            if stored_password.startswith("$2b$") or stored_password.startswith("$2a$"):
                is_valid = verify_password(password, stored_password)
            else:
                # Legacy plain text comparison and migrate to hash
                if stored_password == password:
                    is_valid = True
                    user["password"] = get_password_hash(password)
                    save_db(user_db)
        
        if not is_valid:
             logger.warning(f"Login failed: Invalid password for {email}")
             return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid email or password"})
        
        # Create access token (JWT)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        token = create_access_token(
            data={"sub": email}, expires_delta=access_token_expires
        )
        
        logger.info(f"User login successful: {email}")
        return {
            "status": "success",
            "token": token,
            "user": user
        }
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.put("/profile")
async def update_profile(request: UpdateProfileRequest, r: Request):
    user = get_current_user(r)
    if not user:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Not authenticated"})
    
    try:
        old_email = user["email"]
        user["name"] = request.name
        user["location"] = request.location
        user["gender"] = request.gender
        user["birthdate"] = request.birthdate
        
        # Special case: if email changed
        if request.email != old_email:
            user_db["users"][request.email] = user
            del user_db["users"][old_email]
            
            # Update all active sessions for this user to the new email
            for token, email in user_db["sessions"].items():
                if email == old_email:
                    user_db["sessions"][token] = request.email
        
        save_db(user_db)
        return {
            "status": "success",
            "user": user
        }
    except Exception as e:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})

@app.post("/profile/upload-image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    user = get_current_user(request)
    if not user:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Not authenticated"})

    try:
        file_extension = os.path.splitext(file.filename)[1]
        filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Update user avatar URL
        image_url = f"http://localhost:8000/uploads/{filename}"
        user["avatar"] = image_url
        save_db(user_db)
        
        return {
            "status": "success",
            "avatar": image_url
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Upload failed: {str(e)}"})

@app.post("/predict")
async def predict(request: Request, file: UploadFile = File(...)):
    if not file or not file.content_type or not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid file type or no file provided"})

    try:
        image_bytes = await file.read()
        input_tensor = preprocess_image(image_bytes)
        input_tensor = input_tensor.to(device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
        predicted_idx = predicted.item()
        conf_score = confidence.item()
        
        if conf_score < 0.5:
             logger.info(f"Low confidence prediction: {conf_score:.2f}. Returning uncertain.")
             return {
                "status": "success",
                "category": "Uncertain waste classification",
                "confidence": round(conf_score * 100, 2),
                "points": 0,
                "instructions": "Please try scanning again with better lighting or a different angle.",
                "recyclable": False
            }

        raw_category = class_mapping.get(str(predicted_idx), "unknown")
        
        # Map to frontend expected categories
        category_map = {
            'cardboard': 'Cardboard',
            'glass': 'Glass',
            'metal': 'Metal',
            'paper': 'Paper',
            'plastic': 'Plastic',
            'trash': 'Organic'
        }
        category = category_map.get(raw_category, raw_category.capitalize())
        
        conf_percent = conf_score * 100
        logger.info(f"Model detected: {raw_category} -> Mapped to UI Category: {category} ({conf_percent:.2f}%)")
        
        user = get_current_user(request)
        if user:
            points = 10 if conf_percent > 70 else 5
            user["points"] += points
            user["scans"] += 1
            user["history"].insert(0, {
                "date": "2024-03-21", # Mock date
                "item": category,
                "points": points
            })
            save_db(user_db)

        # Generate instructions and recycling status based on category
        instructions = "Dispose in general waste."
        recyclable = True
        
        if category == "Plastic":
            instructions = "Rinse and recycle in blue bin."
        elif category == "Paper":
            instructions = "Keep dry and recycle in yellow bin."
        elif category == "Metal":
            instructions = "Rinse and recycle in blue bin."
        elif category == "Glass":
            instructions = "Remove cap and recycle."
        elif category == "Organic":
            instructions = "Compost in green bin."
            recyclable = True

        return {
            "status": "success",
            "category": category,
            "confidence": round(conf_percent, 2),
            "points": 10 if conf_percent > 70 else 5,
            "instructions": instructions,
            "recyclable": recyclable
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = get_chatbot_response(request.query)
        return {"status": "success", "response": response}
    except Exception as e:
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})

@app.get("/analytics")
async def get_analytics(request: Request, range: str = Query("weekly")):
    user = get_current_user(request)
    if not user:
        return JSONResponse(status_code=401, content={"status": "error", "message": "Not authenticated"})
        
    # Mock data structure matching frontend expectations
    mock_data = [
        {"name": "Mon", "plastic": 4, "metal": 2, "organic": 10, "paper": 3},
        {"name": "Tue", "plastic": 3, "metal": 1, "organic": 8, "paper": 4},
        {"name": "Wed", "plastic": 5, "metal": 3, "organic": 12, "paper": 2},
        {"name": "Thu", "plastic": 2, "metal": 1, "organic": 9, "paper": 5},
        {"name": "Fri", "plastic": 6, "metal": 4, "organic": 11, "paper": 3},
        {"name": "Sat", "plastic": 8, "metal": 5, "organic": 15, "paper": 6},
        {"name": "Sun", "plastic": 7, "metal": 3, "organic": 13, "paper": 4},
    ]
    
    return {
        "status": "success", 
        "data": mock_data, 
        "stats": {
            "total_waste": "42.5 kg", 
            "recycling_rate": "78%",
            "co2_saved": "12.8 kg",
            "eco_points": "1,240"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
