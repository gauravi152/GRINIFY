import requests

BASE_URL = "http://localhost:8000"

def test_analytics_flow():
    print("Testing Analytics Endpoint...")
    
    # 1. Login to get a token
    email = "test_analytics@example.com"
    login_resp = requests.post(f"{BASE_URL}/auth/login", json={"email": email, "name": "Analytics Tester"})
    token = login_resp.json()["token"]
    print(f"Logged in, token: {token}")

    # 2. Test analytics without token
    print("Testing unauthorized access...")
    unauth_resp = requests.get(f"{BASE_URL}/analytics")
    print(f"Unauthorized request status code: {unauth_resp.status_code}")
    assert unauth_resp.status_code == 401
    print("Correctly rejected unauthorized request.")

    # 3. Test analytics with token
    print("Testing authorized access...")
    headers = {"Authorization": f"Bearer {token}"}
    auth_resp = requests.get(f"{BASE_URL}/analytics", headers=headers)
    assert auth_resp.status_code == 200
    
    data = auth_resp.json()
    assert data["status"] == "success"
    assert len(data["data"]) > 0
    assert "total_waste" in data["stats"]
    assert "recycling_rate" in data["stats"]
    print("Verified analytics data is correctly returned.")

    print("\nAnalytics verification PASSED!")

if __name__ == "__main__":
    try:
        test_analytics_flow()
    except Exception as e:
        print(f"Test failed: {e}")
