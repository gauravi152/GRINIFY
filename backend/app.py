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

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Security configuration
SECRET_KEY = "grinify_secret_key_change_me_in_production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 # 24 hours

app = FastAPI(title="Grinify AI Backend")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

# Configure CORS
# We explicitly allow both localhost and 127.0.0.1 on common development ports
# to ensure the frontend can always connect regardless of how it's accessed.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers including Authorization
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
        "challenges": {
            "daily": {"target": 3, "progress": 0, "completed": False, "last_updated": datetime.utcnow().strftime("%Y-%m-%d")},
            "weekly": {"target": 15, "progress": 0, "completed": False, "last_updated_week": datetime.utcnow().isocalendar()[1]},
            "monthly": {"target": 50, "progress": 0, "completed": False, "last_updated_month": datetime.utcnow().month}
        },
        "history": [
            {"date": "2024-03-20", "item": "Plastic", "points": 10},
            {"date": "2024-03-19", "item": "Paper", "points": 5},
            {"date": "2024-03-18", "item": "Metal", "points": 10}
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
                
                # Migrate challenges for existing users
                for user_email, user_data in data["users"].items():
                    if "challenges" not in user_data:
                        user_data["challenges"] = {
                            "daily": {"target": 3, "progress": 0, "completed": False, "last_updated": datetime.utcnow().strftime("%Y-%m-%d")},
                            "weekly": {"target": 15, "progress": 0, "completed": False, "last_updated_week": datetime.utcnow().isocalendar()[1]},
                            "monthly": {"target": 50, "progress": 0, "completed": False, "last_updated_month": datetime.utcnow().month}
                        }
                    
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

def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        if email not in user_db["users"]:
            raise HTTPException(status_code=401, detail="User not found")
        return user_db["users"][email]
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalid or expired")

def get_current_user_optional(token: str = Depends(oauth2_scheme)):
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email and email in user_db["users"]:
            return user_db["users"][email]
        return None
    except JWTError:
        return None

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
    """Root endpoint to verify backend is reachable."""
    return {"message": "Grinify AI Backend is running!"}

@app.get("/health")
def health_check():
    """
    Health check endpoint for frontend to verify API connection stability.
    Returns: {"status": "ok"}
    """
    return {"status": "ok"}

@app.get("/user/data")
@app.get("/user/profile")
async def get_user_data(user: dict = Depends(get_current_user)):
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
async def update_profile(request: UpdateProfileRequest, user: dict = Depends(get_current_user)):
    
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
async def upload_image(file: UploadFile = File(...), user: dict = Depends(get_current_user)):

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
async def predict(file: UploadFile = File(...), user: dict | None = Depends(get_current_user_optional)):
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
        
        # 1. SCAN -> DATA STORAGE FIX (Fixed 20 points)
        points = 20
        
        if user:
            # Update user stats
            user["points"] += points
            user["scans"] += 1
            
            now = datetime.utcnow()
            today_str = now.strftime("%Y-%m-%d")
            current_week = now.isocalendar()[1]
            current_month = now.month
            
            user["history"].insert(0, {
                "date": today_str,
                "category": category,
                "points": points
            })
            
            # Handle Challenges
            if "challenges" not in user:
                user["challenges"] = {
                    "daily": {"target": 3, "progress": 0, "completed": False, "last_updated": today_str},
                    "weekly": {"target": 15, "progress": 0, "completed": False, "last_updated_week": current_week},
                    "monthly": {"target": 50, "progress": 0, "completed": False, "last_updated_month": current_month}
                }
            
            challenges = user["challenges"]
            
            # Daily Reset
            if challenges["daily"].get("last_updated") != today_str:
                challenges["daily"] = {"target": 3, "progress": 0, "completed": False, "last_updated": today_str}
            # Weekly Reset
            if challenges["weekly"].get("last_updated_week") != current_week:
                challenges["weekly"] = {"target": 15, "progress": 0, "completed": False, "last_updated_week": current_week}
            # Monthly Reset
            if challenges["monthly"].get("last_updated_month") != current_month:
                challenges["monthly"] = {"target": 50, "progress": 0, "completed": False, "last_updated_month": current_month}
                
            # Increment & Check logic (ensure reward given only once)
            for ch_type, config in challenges.items():
                if config["progress"] < config["target"]:
                    config["progress"] += 1
                    if config["progress"] >= config["target"] and not config["completed"]:
                        config["completed"] = True
                        if ch_type == "daily":
                            user["points"] += 20
                        elif ch_type == "weekly":
                            user["points"] += 100
                        elif ch_type == "monthly":
                            user["points"] += 500
                            
            save_db(user_db)
            
            # 5. DEBUG LOGGING (TEMPORARY)
            print("=========================================")
            print(f"DEBUG: Scan successful for {user.get('email')}")
            print(f"Updated Points: {user['points']}")
            print(f"Updated Scans: {user['scans']}")
            print(f"History Length: {len(user['history'])}")
            print("=========================================")

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
            "points": points,
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
async def get_analytics(range: str = Query("weekly"), user: dict = Depends(get_current_user)):
    try:
        history = user.get("history", [])
        
        categories_count = {}
        
        try:
            sorted_history = sorted(history, key=lambda x: datetime.strptime(x.get("date", "2000-01-01"), "%Y-%m-%d"), reverse=True)
        except:
            sorted_history = history
            
        daily_entries = sorted_history[:7]
        monthly_entries = sorted_history[:30]
        
        weekly_map = {}
        for entry in sorted_history:
            date_str = entry.get("date", "")
            item = entry.get("category", entry.get("item", "Organic")).lower()
            pts = entry.get("points", 0)
            
            if item not in categories_count:
                categories_count[item] = 0
            categories_count[item] += 1
            
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
                day_name = dt.strftime("%a")
                if day_name not in weekly_map:
                    weekly_map[day_name] = {"name": day_name, "plastic": 0, "organic": 0, "paper": 0, "metal": 0, "glass": 0, "cardboard": 0}
                if item in weekly_map[day_name]:
                    weekly_map[day_name][item] += 1
                else:
                    weekly_map[day_name]["organic"] += 1
            except:
                pass
                
        points_list = []
        for entry in reversed(sorted_history):
            date_str = entry.get("date", "")
            if date_str:
                points_list.append({"name": date_str, "points": entry.get("points", 0)})
        
        weekly_entries = list(weekly_map.values())
        
        total_scans = len(sorted_history)
        total_points = sum(e.get("points",0) for e in sorted_history)
        total_recyclable = sum(1 for e in sorted_history if e.get("category", e.get("item", "")).lower() in ["plastic", "metal", "paper", "glass", "cardboard"])
        rate = f"{int((total_recyclable / total_scans) * 100)}%" if total_scans > 0 else "0%"

        return {
            "status": "success",
            "daily": daily_entries,
            "weekly": weekly_entries,
            "monthly": monthly_entries,
            "categories": categories_count,
            "points": points_list,
            "stats": {
                "total_waste": f"{total_scans} Scans",
                "recycling_rate": rate,
                "co2_saved": f"{round(total_recyclable * 0.5, 1)} kg",
                "eco_points": str(total_points)
            }
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Server Error: {str(e)}"})

@app.get("/leaderboard")
async def get_leaderboard():
    try:
        users_list = []
        for email, u in user_db["users"].items():
            users_list.append({
                "name": u.get("name", "Unknown"),
                "points": u.get("points", 0),
                "scans": u.get("scans", 0),
                "avatar": u.get("avatar"),
                "impact_level": u.get("rank", "Green Starter")
            })
        
        # Sort by points descending
        users_list.sort(key=lambda x: x["points"], reverse=True)
        
        # Assign numeric rank
        for i, u in enumerate(users_list):
            u["rank"] = i + 1
            
        return {"status": "success", "leaderboard": users_list}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Server Error: {str(e)}"})

if __name__ == "__main__":
    import uvicorn
    # Log startup info clearly
    print("\n" + "="*50)
    print("GRINIFY BACKEND STARTING")
    print("API Base URL: http://127.0.0.1:8000")
    print("Health Check: http://127.0.0.1:8000/health")
    print("="*50 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
