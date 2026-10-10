"""Inference-compatible definition of the supplied trained architecture.

Layer names and dimensions match train_densenet_transformer.py. The checkpoint
fully replaces every initialized parameter before inference; torchvision's
ImageNet initializer is disabled here to avoid downloads at application start.
"""
import torch
from torch import nn
from torchvision import models


class DenseNetTransformerFusion(nn.Module):
    def __init__(self, num_classes: int, embedding_dim: int = 256,
                 transformer_layers: int = 2, heads: int = 8,
                 dropout: float = 0.2):
        super().__init__()
        densenet = models.densenet121(weights=None)
        self.feature_extractor = densenet.features
        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.token_projection = nn.Sequential(
            nn.Linear(1024, embedding_dim),
            nn.LayerNorm(embedding_dim),
            nn.GELU(),
        )
        layer = nn.TransformerEncoderLayer(
            d_model=embedding_dim,
            nhead=heads,
            dim_feedforward=embedding_dim * 4,
            dropout=dropout,
            activation="gelu",
            batch_first=True,
            norm_first=True,
        )
        self.transformer = nn.TransformerEncoder(layer, num_layers=transformer_layers)
        self.classifier = nn.Sequential(
            nn.Linear(1024 + embedding_dim, 512),
            nn.BatchNorm1d(512),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(512, num_classes),
        )

    def forward(self, images):
        feature_maps = self.feature_extractor(images)
        cnn_vector = self.pool(feature_maps).flatten(1)
        token = self.token_projection(cnn_vector).unsqueeze(1)
        transformer_vector = self.transformer(token).squeeze(1)
        return self.classifier(torch.cat((cnn_vector, transformer_vector), dim=1))
