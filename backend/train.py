import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Subset
from torchvision import datasets, transforms
import numpy as np
import os
import json
from sklearn.metrics import confusion_matrix, classification_report
from model import get_model

def train_model(data_dir='backend/data', num_epochs=15, batch_size=32, learning_rate=0.001):
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Training on device: {device}")

    if not os.path.exists(data_dir):
        print(f"Data directory {data_dir} not found. Please ensure TrashNet is in {data_dir}")
        return

    # Stronger Data Augmentation
    train_transform = transforms.Compose([
        transforms.RandomResizedCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2, hue=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    val_test_transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])

    # Load Full Dataset
    full_dataset = datasets.ImageFolder(data_dir)
    class_names = full_dataset.classes
    num_classes = len(class_names)
    print(f"Classes ({num_classes}): {class_names}")

    # Export Class Mapping for Inference Parity
    class_mapping = {i: name for i, name in enumerate(class_names)}
    with open('backend/class_mapping.json', 'w') as f:
        json.dump(class_mapping, f, indent=4)
    print("Exported backend/class_mapping.json")

    # Generate exact splits: 70% Train, 15% Val, 15% Test
    total_size = len(full_dataset)
    indices = np.random.permutation(total_size)
    
    train_split = int(0.7 * total_size)
    val_split = int(0.85 * total_size)
    
    train_indices = indices[:train_split]
    val_indices = indices[train_split:val_split]
    test_indices = indices[val_split:]

    # Apply transforms using custom indices
    class CustomSubset(torch.utils.data.Dataset):
        def __init__(self, subset, transform=None):
            self.subset = subset
            self.transform = transform
            
        def __getitem__(self, index):
            x, y = self.subset[index]
            if self.transform:
                x = self.transform(x)
            return x, y
            
        def __len__(self):
            return len(self.subset)

    train_dataset = CustomSubset(Subset(full_dataset, train_indices), transform=train_transform)
    val_dataset = CustomSubset(Subset(full_dataset, val_indices), transform=val_test_transform)
    test_dataset = CustomSubset(Subset(full_dataset, test_indices), transform=val_test_transform)

    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)
    test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    # Initialize model
    model = get_model(num_classes=num_classes).to(device)
    
    # 1. Freeze early layers (ResNet backbone)
    print("Freezing ResNet backbone for initial training of FC head...")
    for name, param in model.model.named_parameters():
        if "fc" not in name:
            param.requires_grad = False

    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=learning_rate)

    best_val_acc = 0.0

    # Phase 1: Train FC Head
    print("\n--- Phase 1: Training Final Layer ---")
    for epoch in range(5): # 5 epochs for the head
        train_one_epoch(model, train_loader, criterion, optimizer, device, epoch, 5)
        val_acc = validate(model, val_loader, criterion, device)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'backend/waste_model.pth')

    # Phase 2: Unfreeze and Fine-tune
    print("\n--- Phase 2: Fine-tuning Full Model ---")
    for param in model.parameters():
        param.requires_grad = True
    
    # Lower learning rate for fine-tuning
    optimizer = optim.Adam(model.parameters(), lr=learning_rate / 10)

    for epoch in range(num_epochs): 
        train_one_epoch(model, train_loader, criterion, optimizer, device, epoch, num_epochs)
        val_acc = validate(model, val_loader, criterion, device)
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), 'backend/waste_model.pth')

    print(f"\nTraining Complete. Best Validation Accuracy: {best_val_acc:.2f}%")
    
    # Final Evaluation
    print("\n--- Final Evaluation ---")
    model.load_state_dict(torch.load('backend/waste_model.pth'))
    model.eval()
    
    all_preds = []
    all_targets = []
    with torch.no_grad():
        for images, labels in test_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs.data, 1)
            all_preds.extend(predicted.cpu().numpy())
            all_targets.extend(labels.cpu().numpy())

    print(classification_report(all_targets, all_preds, target_names=class_names))
    print("Confusion Matrix:")
    print(confusion_matrix(all_targets, all_preds))

def train_one_epoch(model, loader, criterion, optimizer, device, epoch, total_epochs):
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0
    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
        _, predicted = torch.max(outputs.data, 1)
        total += labels.size(0)
        correct += (predicted == labels).sum().item()
    
    print(f"Epoch [{epoch+1}/{total_epochs}] Loss: {running_loss/len(loader):.4f} Acc: {100*correct/total:.2f}%")

def validate(model, loader, criterion, device):
    model.eval()
    correct = 0
    total = 0
    with torch.no_grad():
        for images, labels in loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            _, predicted = torch.max(outputs, 1)
            total += labels.size(0)
            correct += (predicted == labels).sum().item()
    acc = 100 * correct / total
    print(f"Validation Acc: {acc:.2f}%")
    return acc

if __name__ == "__main__":
    train_model(num_epochs=15)
