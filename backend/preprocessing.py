from torchvision import transforms
from PIL import Image
import io

# Define the transformation pipeline
preprocess_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

def preprocess_image(image_bytes):
    try:
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        return preprocess_transform(image).unsqueeze(0) # Add batch dimension
    except Exception as e:
        raise ValueError(f"Invalid image content: {e}")
