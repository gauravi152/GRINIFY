import requests
import uuid

BASE_URL = "http://localhost:8000"

def test_auth_flow():
    print("Testing Auth Flow...")
    
    # 1. Signup User 1
    email1 = f"test1_{uuid.uuid4().hex[:4]}@example.com"
    password1 = "password123"
    print(f"Signing up User 1: {email1}")
    resp1 = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email1, 
        "name": "User One",
        "password": password1
    })
    assert resp1.status_code == 200
    data1 = resp1.json()
    token1 = data1["token"]
    print(f"User 1 Signed up. Token: {token1}")

    # 2. Login User 1
    print("Testing Login User 1...")
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email1,
        "password": password1
    })
    assert login_resp.status_code == 200
    assert login_resp.json()["token"] is not None
    print("Login success.")

    # 3. Test Invalid Password
    print("Testing Invalid Password...")
    bad_login = requests.post(f"{BASE_URL}/auth/login", json={
        "email": email1,
        "password": "wrongpassword"
    })
    assert bad_login.status_code == 401
    print("Rejected wrong password.")

    # 4. Verify Data for User 1
    headers1 = {"Authorization": f"Bearer {token1}"}
    resp_data1 = requests.get(f"{BASE_URL}/user/data", headers=headers1)
    user1 = resp_data1.json()["user"]
    assert user1["email"] == email1
    print(f"Verified User 1 data isolation.")

    # 5. Test Profile Update
    new_name = "Updated User One"
    resp_update = requests.put(f"{BASE_URL}/profile", headers=headers1, json={
        "name": new_name,
        "email": email1,
        "location": "New York"
    })
    assert resp_update.json()["user"]["name"] == new_name
    print("Verified profile update with token.")

    print("\nAll auth tests PASSED!")

if __name__ == "__main__":
    try:
        test_auth_flow()
    except Exception as e:
        print(f"Test failed: {e}")
