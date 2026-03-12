import requests
import os
import json

BASE_URL = "http://localhost:8000"

def test_pipeline():
    print("--- Testing Full Grinify Pipeline ---")
    
    # 1. Signup
    signup_payload = {
        "name": "Pipeline Tester",
        "email": "tester@example.com",
        "password": "testingpassword123"
    }
    print(f"Testing Signup for {signup_payload['email']}...")
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_payload)
        if response.status_code == 400 and "already registered" in response.text:
            print("User already exists, proceeding to login.")
        else:
            response.raise_for_status()
            print("Signup successful.")
    except Exception as e:
        print(f"Signup failed: {e}")

    # 2. Login
    login_payload = {
        "email": "tester@example.com",
        "password": "testingpassword123"
    }
    print("Testing Login...")
    response = requests.post(f"{BASE_URL}/auth/login", json=login_payload)
    response.raise_for_status()
    auth_data = response.json()
    token = auth_data["token"]
    print("Login successful. Token received.")

    # 3. Predict (Upload Image)
    # We'll use the existing test_image.jpg if it exists, otherwise we'll skip this part or wait
    image_path = os.path.join(os.path.dirname(__file__), "test_image.jpg")
    if not os.path.exists(image_path):
        print(f"Test image not found at {image_path}. Skipping prediction test.")
    else:
        print(f"Testing Prediction with {image_path}...")
        headers = {"Authorization": f"Bearer {token}"}
        with open(image_path, "rb") as f:
            files = {"file": ("test.jpg", f, "image/jpeg")}
            response = requests.post(f"{BASE_URL}/predict", headers=headers, files=files)
            response.raise_for_status()
            prediction = response.json()
            print(f"Prediction result: {prediction['category']} ({prediction['confidence']}%)")
            print(f"Points awarded: {prediction['points']}")

    # 4. Verify Profile and History
    print("Verifying points in profile...")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/user/profile", headers=headers)
    response.raise_for_status()
    profile = response.json()["user"]
    print(f"Current User Points: {profile['points']}")
    print(f"Scan History count: {len(profile.get('history', []))}")
    
    print("\n--- Pipeline Test Complete ---")

if __name__ == "__main__":
    # Ensure backend is running before testing
    try:
        requests.get(BASE_URL)
        test_pipeline()
    except requests.exceptions.ConnectionError:
        print(f"Error: Backend is not running at {BASE_URL}. Please start it first.")
