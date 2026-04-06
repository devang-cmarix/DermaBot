import os
from pathlib import Path
from langchain_cohere import ChatCohere
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv
load_dotenv()

COHERE_API_KEY = os.getenv("COHERE_API_KEY")
BASE_DIR = Path(__file__).resolve().parents[2]
FAISS_INDEX_PATH = BASE_DIR / "notebook" / "faiss_index"

if COHERE_API_KEY:
    os.environ["COHERE_API_KEY"] = COHERE_API_KEY


embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/clip-ViT-B-32"
)

vectorstore = FAISS.load_local(
    str(FAISS_INDEX_PATH),
    embedding,
    allow_dangerous_deserialization=True,
)

retriever = vectorstore.as_retriever(search_kwargs={"k": 3})

llm = ChatCohere(
    model="command-a-03-2025",
    temperature=0,
    max_tokens=300,
)

import fasttext

model_path = Path(__file__).resolve().parent / "lid.176.bin"
lang_model = fasttext.load_model(str(model_path))

LANG_MAP = {
    "en": "eng_Latn",
    "hi": "hin_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "kn": "kan_Knda",
    "ml": "mal_Mlym",
    "mr": "mar_Deva",
    "gu": "guj_Gujr",
    "bn": "ben_Beng",
    "pa": "pan_Guru",
    "or": "ory_Orya",
}

def detect_language(text: str) -> str:
    # ✅ Remove newlines before prediction
    text = text.replace("\n", " ").strip()
    labels, _ = lang_model.predict(text)
    label = labels[0]
    if isinstance(label, list):
        label = label[0]
    return label.replace("__label__", "")

GREETINGS = ["hi", "hello", "hey", "hii", "helo", "good morning", "good evening", "how are you"]

def rag_answer(question: str, memory: str = ""):

    def is_english(text):
        return all(ord(c) < 128 for c in text)

    # Detect language
    lang = detect_language(question)
    needs_translation = not is_english(question)

    LANG_NAMES = {
        "gu": "Gujarati (ગુજરાતી script only)",
        "hi": "Hindi (हिंदी Devanagari script only)",
        "ta": "Tamil (தமிழ் script only)",
        "te": "Telugu (తెలుగు script only)",
        "mr": "Marathi (मराठी script only)",
        "bn": "Bengali (বাংলা script only)",
        "kn": "Kannada (ಕನ್ನಡ script only)",
        "ml": "Malayalam (മലയാളം script only)",
        "pa": "Punjabi (ਪੰਜਾਬੀ script only)",
    }

    lang_instruction = (
        f"CRITICAL INSTRUCTION: The user wrote in {LANG_NAMES.get(lang, 'English')}. "
        f"You MUST respond in the EXACT same language and script. "
        f"Do NOT use Hindi. Do NOT mix languages. "
        f"Every single word in your response must be in {LANG_NAMES.get(lang, 'English')} only."
        if needs_translation else ""
    )

    # Greeting check (on original question)
    if question.strip().lower() in GREETINGS:
        if needs_translation:
            docs = []
            context = ""
            greeting_instruction = lang_instruction
            prompt = f"""{greeting_instruction}
Respond with a warm greeting as MedGenius medical assistant."""
            response = llm.invoke(prompt)
            return response.content.strip()
        return "Hello! 👋 I'm MediBot, your medical assistant. How can I help you today?"

    # RAG
    # Pass ORIGINAL question to retriever for better matching
    docs = retriever.invoke(question)
    context = "\n\n".join([doc.page_content for doc in docs])
    memory_block = memory or "No prior conversation."

    prompt = f"""You are MediBot, a friendly medical AI assistant specializing in dermatology.

{lang_instruction}

INSTRUCTIONS:
- Identify the skin condition based on described symptoms.
- Use the retrieved context to answer accurately.
- If context is insufficient, answer from general medical knowledge.
- Keep response concise, 3-5 sentences maximum.
- Do NOT use asterisks, bullet points, or special characters.
- Do NOT repeat the question back.
- Do NOT respond in English if user wrote in another language.

Recent conversation:
{memory_block}

Retrieved medical context:
{context}

User: {question}
MediBot:"""

    response = llm.invoke(prompt)
    return response.content.strip().replace("*", "").replace("।", ".")