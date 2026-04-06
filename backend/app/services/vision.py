import os
os.environ["TRANSFORMERS_OFFLINE"] = "1"
from pathlib import Path

import torch
from PIL import Image
from transformers import BlipProcessor, BlipForConditionalGeneration
from .rag import rag_answer as generate_answer

device = "cpu"
model_path = str(Path(__file__).resolve().parents[2] / "model" / "blip")

processor = BlipProcessor.from_pretrained(model_path, local_files_only=True)
model = BlipForConditionalGeneration.from_pretrained(model_path, local_files_only=True).to(device)

def analyze_disease_image(image: Image.Image) -> str:
    inputs = processor(image, return_tensors="pt").to(device)
    output = model.generate(**inputs, max_new_tokens=50)
    caption = processor.decode(output[0], skip_special_tokens=True)
    return caption

def get_disease_analysis(image: Image.Image):
    caption = analyze_disease_image(image)
    
    prompt = f"""The following is a visual description of a possible medical condition.
Image description: {caption}

Based on this, provide:
- Possible disease or condition
- Common symptoms
- Precautions to take
- When to see a doctor
"""
    answer = generate_answer(prompt)
    return caption, answer
