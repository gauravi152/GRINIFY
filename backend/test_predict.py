import requests
from PIL import Image

# Create a valid blank RGB image
img = Image.new('RGB', (224, 224), color = 'red')
img.save('test_image.jpg')

url = "http://localhost:8000/predict"

with open("test_image.jpg", "rb") as f:
    files = {"file": ("test_image.jpg", f, "image/jpeg")}
    response = requests.post(url, files=files)

print("Status Code:", response.status_code)
print("Response:", response.json())
