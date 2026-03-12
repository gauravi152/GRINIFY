import torch
import torch.nn as nn
from torchvision import models

class WasteCNN(nn.Module):
    def __init__(self, num_classes=6):
        super(WasteCNN, self).__init__()
        weights = models.ResNet18_Weights.DEFAULT
        self.model = models.resnet18(weights=weights)
        
        # Replace the final fully connected layer to output num_classes directly
        num_ftrs = self.model.fc.in_features
        self.model.fc = nn.Linear(num_ftrs, num_classes)
        
    def forward(self, x):
        return self.model(x)

def get_model(num_classes=6):
    return WasteCNN(num_classes=num_classes)
