import torch
import torch.nn as nn
from torchvision import models
import json

class WasteCNN(nn.Module):
    def __init__(self, num_classes=5):
        super(WasteCNN, self).__init__()
        # Load a pretrained ResNet18 model
        weights = models.ResNet18_Weights.DEFAULT
        self.model = models.resnet18(weights=weights)
        
        # We don't replace the FC layer to keep ImageNet classes (1000)
        # Instead, we will handle the mapping in app.py logic
        
        # However, if someone wants to train it specifically for 5 classes:
        self.is_finetuned = False
        
    def forward(self, x):
        return self.model(x)
        
    def finetune_mode(self, num_classes=5):
        """Replaces the final layer for standard transfer learning training"""
        num_ftrs = self.model.fc.in_features
        self.model.fc = nn.Linear(num_ftrs, num_classes)
        self.is_finetuned = True

def get_model(num_classes=5):
    return WasteCNN(num_classes=num_classes)

