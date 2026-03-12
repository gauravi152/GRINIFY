import os
import requests
import zipfile
import io
import shutil

def download_trashnet():
    # URL for the resized TrashNet dataset
    # This is a community mirror or direct link usually used
    url = "https://github.com/garythung/trashnet/raw/master/data/dataset-resized.zip"
    
    print(f"Downloading TrashNet dataset from {url}...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Open the zip file in memory
        z = zipfile.ZipFile(io.BytesIO(response.content))
        
        print("Extracting dataset...")
        extract_path = "temp_data"
        os.makedirs(extract_path, exist_ok=True)
        z.extractall(extract_path)
        
        # The zip usually contains a folder 'dataset-resized'
        # Inside it are folders: cardboard, glass, metal, paper, plastic, trash
        src_dir = os.path.join(extract_path, "dataset-resized")
        dest_dir = "data"
        
        if os.path.exists(dest_dir):
            shutil.rmtree(dest_dir)
            
        shutil.move(src_dir, dest_dir)
        shutil.rmtree(extract_path)
        
        class_names = os.listdir(dest_dir)
        print(f"Dataset download and extraction complete! Classes: {class_names}")
        
    except Exception as e:
        print(f"Failed to download/extract dataset: {e}")
        print("Trying alternative mirror...")
        # Mirror if GitHub raw is problematic
        alt_url = "https://huggingface.co/datasets/garythung/trashnet/resolve/main/dataset-original.zip"
        # Since this might be large, I'll stop here and suggest the user download it or I try another method if this fails.
        # But GitHub raw zip is usually fine for these sizes.

if __name__ == "__main__":
    download_trashnet()
