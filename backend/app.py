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

app = FastAPI(title="Grinify AI Backend")

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

def get_initial_user(name, email, password):
    return {
        "name": name,
        "email": email,
        "password": password,
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
    email = user_db["sessions"].get(token)
    
    if not email or email not in user_db["users"]:
        return None
        
    return user_db["users"][email]

@app.get("/debug/db")
def debug_db():
    return user_db

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Device Configuration
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Initialize ResNet18 model
CLASS_NAMES = ["Glass", "Metal", "Paper", "Plastic", "Organic"]
model = get_model() # This now returns ResNet18 with ImageNet weights
model.to(device)
model.eval()

with open(os.path.join(os.path.dirname(__file__), "imagenet_class_index.json"), "r") as f:
    imagenet_mapping = json.load(f)

# Helper function to categorize ImageNet labels to our 5 classes
def map_imagenet_to_waste(imagenet_label: str) -> str:
    label = imagenet_label.lower()
    
    # Plastic mappings
    if any(word in label for word in ["bottle", "bag", "cup", "plastic", "bucket", "container", "jug", "nipple", "pacifier", "rubber_eraser"]):
        return "Plastic"
    # Metal mappings
    elif any(word in label for word in ["can", "tin", "aluminum", "spoon", "fork", "knife", "pot", "pan", "bucket", "safe", "nail", "screw", "padlock", "chain"]):
        return "Metal"
    # Glass mappings
    elif any(word in label for word in ["glass", "jar", "goblet", "wine_bottle", "beer_glass", "beaker", "cup"]):
        return "Glass"
    # Paper/Cardboard mappings
    elif any(word in label for word in ["paper", "cardboard", "box", "envelope", "book", "magazine", "newspaper", "tissue", "carton"]):
        return "Paper"
    # Organic mappings
    elif any(word in label for word in ["apple", "banana", "orange", "lemon", "strawberry", "pizza", "burger", "hotdog", "food", "vegetable", "fruit", "mushroom", "broccoli", "cauliflower"]):
        return "Organic"
    
    # Default fallback
    return "Plastic"  # Most common fall back for packaging


@app.get("/")
def read_root():
    return {"message": "Grinify AI Backend is running!"}

@app.get("/user/data")
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
            return JSONResponse(status_code=400, content={"status": "error", "message": "Email already registered"})
        
        user_db["users"][email] = get_initial_user(request.name, email, request.password)
        
        # Create new session
        token = "token_" + str(uuid.uuid4())[:8]
        user_db["sessions"][token] = email
        
        save_db(user_db)
        return {
            "status": "success",
            "token": token,
            "user": user_db["users"][email]
        }
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

@app.post("/auth/login")
async def auth_login(request: AuthLoginRequest):
    try:
        email = request.email
        password = request.password
        
        if email not in user_db["users"]:
            return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid email or password"})
        
        user = user_db["users"][email]
        # In a real app we'd hash passwords, but for now we'll do direct comparison
        # Handle cases where users in users.json might not have passwords yet
        stored_password = user.get("password")
        if stored_password and stored_password != password:
             return JSONResponse(status_code=401, content={"status": "error", "message": "Invalid email or password"})
        
        # If user exists but has no password (legacy), set it now
        if not stored_password:
            user["password"] = password
            
        # Create new session
        token = "token_" + str(uuid.uuid4())[:8]
        user_db["sessions"][token] = email
        
        save_db(user_db)
        return {
            "status": "success",
            "token": token,
            "user": user
        }
    except Exception as e:
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
    if not file.content_type.startswith("image/"):
        return JSONResponse(status_code=400, content={"status": "error", "message": "Invalid file type"})

    try:
        image_bytes = await file.read()
        input_tensor = preprocess_image(image_bytes)
        input_tensor = input_tensor.to(device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            probabilities = F.softmax(outputs, dim=1)
            confidence, predicted = torch.max(probabilities, 1)
            
        imagenet_idx = str(predicted.item())
        imagenet_label = imagenet_mapping.get(imagenet_idx, ["", "unknown"])[1]
        
        category = map_imagenet_to_waste(imagenet_label)
        # ResNet is very confident on ImageNet, we slightly scale or just return it directly
        conf_score = confidence.item() * 100
        print(f"ImageNet detected: {imagenet_label} -> Mapped to: {category} ({conf_score:.2f}%)")
        
        user = get_current_user(request)
        if user:
            points = 10 if conf_score > 70 else 5
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
            "confidence": round(conf_score, 2),
            "points": 10 if conf_score > 70 else 5,
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
