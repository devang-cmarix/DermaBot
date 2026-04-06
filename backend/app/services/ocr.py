from PIL import Image
import numpy as np
from io import BytesIO
import fitz  # pymupdf - pip install pymupdf
from doctr.models import ocr_predictor

model = ocr_predictor(pretrained=True)

def extract_text_from_images(images: list) -> str:
    """Takes a list of numpy arrays (pages) and runs doctr OCR."""
    result = model(images)
    return result.render()

def extract_text(file_bytes: bytes, content_type: str = "") -> str:
    if not file_bytes or len(file_bytes) < 10:
        raise ValueError("Empty or invalid file received")

    is_pdf = (
        content_type == "application/pdf"
        or file_bytes[:4] == b"%PDF"
    )

    if is_pdf:
        # Convert each PDF page to numpy array
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        full_text = []

        for page_num in range(len(doc)):
            page = doc[page_num]

            # Try direct text extraction first (fast)
            text = page.get_text().strip()
            if text:
                full_text.append(f"[Page {page_num + 1}]\n{text}")
            else:
                # Scanned page — use doctr OCR
                pix = page.get_pixmap(dpi=200)
                img = Image.open(BytesIO(pix.tobytes("png"))).convert("RGB")
                pages.append(np.array(img))

        doc.close()

        # Run doctr on scanned pages
        if pages:
            ocr_text = extract_text_from_images(pages)
            full_text.append(ocr_text)

        return "\n\n".join(full_text)

    else:
        # Single image
        image = Image.open(BytesIO(file_bytes)).convert("RGB")
        image_np = np.array(image)
        return extract_text_from_images([image_np])

def extract_medical_query(text: str, llm) -> str:
    # Limit text to avoid token overflow
    truncated = text[:3000]

    prompt = f"""You are a medical text analyzer.

Read the following medical document and extract ONLY the medically relevant information such as:
- Patient's diagnoses and conditions
- Symptoms described
- Medications prescribed (name, dosage, frequency)
- Lab results and values
- Doctor's findings and recommendations

Ignore legal text, declarations, signatures, administrative sections, and non-medical content.
Return a concise medical summary in 3-5 sentences maximum.
If no medical information is found, return "No medical information found."

Document:
{truncated}

Medical Summary:"""

    response = llm.invoke(prompt)
    return response.content.strip()