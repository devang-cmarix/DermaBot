import io
import os
import uuid
import secrets

from fastapi import APIRouter, Depends, FastAPI, File, Form, Header, HTTPException, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware  # ✅ add
from fastapi.responses import RedirectResponse             # ✅ add
from fastapi.staticfiles import StaticFiles
from authlib.integrations.starlette_client import OAuth   # ✅ add
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()  # ✅ add
from .services.chat import build_session_title, get_session_memory
from .db.mongodb import ensure_indexes
from .dependencies.auth import get_current_user
from .repositories.medibot import (
    create_chat_session,
    create_message,
    create_user,
    delete_auth_token,
    delete_session,
    find_user_by_email,
    get_user_api_keys,
    get_user_analytics,
    get_session_for_user,
    update_user_profile,
    get_session_messages,
    get_user_history,
    get_user_settings,
    get_user_sessions,
    revoke_api_key,
    serialize_api_key,
    serialize_message,
    serialize_settings,
    serialize_session,
    serialize_user,
    store_api_key,
    store_auth_token,
    touch_session,
    upsert_user_settings,
)
from .core.security import create_api_key, create_session_token, hash_password, hash_token, verify_password

app = FastAPI(title="MediBot API")

# ✅ Session middleware — required for OAuth state
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY"))

# ✅ Google OAuth setup
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://10.0.4.128:3001")

oauth = OAuth()
oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://10.0.4.128:3000", "http://10.0.4.128:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")


import os, uuid
from fastapi.staticfiles import StaticFiles

# Create uploads folder
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")



# In main.py — serve React build from FastAPI
# from fastapi.staticfiles import StaticFiles
# from fastapi.responses import FileResponse
# import os

# BUILD_DIR = "/home/ctpl4192/Desktop/Dewn/medical Bot/frontend/build"

# # Serve static files
# app.mount("/static", StaticFiles(directory=f"{BUILD_DIR}/static"), name="static")

# @app.get("/{full_path:path}")
# async def serve_react(full_path: str):
#     index = f"{BUILD_DIR}/index.html"
#     return FileResponse(index)



class Query(BaseModel):
    question: str = Field(min_length=1)
    session_id: str | None = None


class AuthPayload(BaseModel):
    name: str | None = None
    email: str
    password: str = Field(min_length=6)


class CreateSessionPayload(BaseModel):
    title: str | None = None


class CreateApiKeyPayload(BaseModel):
    name: str = Field(min_length=2, max_length=40)


class UpdateUserPayload(BaseModel):
    name: str = Field(min_length=2, max_length=40)
    email: str


class UpdateSettingsPayload(BaseModel):
    darkMode: bool
    notifications: bool
    autoSave: bool
    medicalDisclaimer: bool
    model: str


PRODUCTION_API_BASE = os.getenv("PRODUCTION_API_BASE", "https://nonconfident-stapedial-cherrie.ngrok-free.dev")


settings_defaults = {
    "darkMode": True,
    "notifications": True,
    "autoSave": True,
    "medicalDisclaimer": True,
    "model": "flan-t5-base",
}

initial_message = {
    "role": "bot",
    "text": "Hello! I'm MediBot, your AI medical assistant. I can answer health questions, analyze prescriptions, and help you understand medical reports. How can I help you today?",
    "time": "Just now",
}

suggestions = [
    "How can I treat my acne?",
    "What is the best way to treat dry or itchy skin?",
    "Do I need to get yearly checks for skin cancer?",
    "Why is my skin so dry?",
]

upload_types = [
    {"name": "OCR", "color": "#4f8ef7"},
    {"name": "Prescription", "color": "#22d3a0"},
    {"name": "Lab Report", "color": "#f7c948"},
]

models = [
    {"name": "flan-t5-base", "desc": "Fast · 250MB"},
    {"name": "flan-t5-large", "desc": "Balanced · 780MB"},
    {"name": "flan-t5-xl", "desc": "Best quality · 3GB"},
]

api_info = [
    ["Endpoint", PRODUCTION_API_BASE],
    ["Status", "Production Ready"],
    ["Version", "v1.2.0"],
]

about = {
    "description": "An AI-powered medical assistant built with FLAN-T5, FAISS, LangChain, FastAPI, React, MongoDB, and session memory.",
    "tech": ["FLAN-T5", "FAISS", "LangChain", "FastAPI", "MongoDB"],
}

plans = [
    {
        "name": "Free",
        "price": "$0",
        "features": ["10 queries/day", "Basic OCR", "Community support"],
        "color": "#6b7691",
    },
    {
        "name": "Pro",
        "price": "$9.99/month",
        "features": ["Unlimited queries", "Advanced OCR", "Priority support", "API access"],
        "color": "#4f8ef7",
    },
    {
        "name": "Enterprise",
        "price": "Custom",
        "features": ["Everything in Pro", "Custom models", "Dedicated support", "On-premise deployment"],
        "color": "#22d3a0",
    },
]

api_sdk = {
    "python": """
import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "BASE_URL_PLACEHOLDER"

def ask(question):
    res = requests.post(
        f"{BASE_URL}/api/ask",
        json={"question": question},
        headers={
            "X-API-Key": API_KEY,
            "Content-Type": "application/json",
        },
        timeout=30,
    )
    res.raise_for_status()
    return res.json()["answer"]
print(ask("ASK ANYTHING RELATED DEMETOLOGY?"))
""",
    "javascript": """
const API_KEY = "YOUR_API_KEY";
const BASE_URL = "BASE_URL_PLACEHOLDER";

const askQuestion = async (question, sessionId) => {
    const response = await fetch(`${BASE_URL}/ask`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY,
        },
        body: JSON.stringify({ question, session_id: sessionId }),
    });
    if (!response.ok) {
        throw new Error("Request failed");
    }
    const data = await response.json();
    return data.answer;
};
""",
    "curl": """
curl -X POST "BASE_URL_PLACEHOLDER/ask" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{"question":"What are symptoms of diabetes?","session_id":"SESSION_ID"}'
""",
}

docs = [
    {
        "title": "Getting Started With MediBot",
        "description": "Use these steps to go from first login to production API usage.",
        "example": "1. Register. 2. Open Chat. 3. Create a session. 4. Ask a medical question. 5. Review history and analytics.",
        "highlights": [
            "Open the app and create an account with your name, email, and password.",
            "After login, MediBot restores your account and loads your saved sessions.",
            "Use the left sidebar to move between Chat, Upload, History, Analytics, API SDK, Docs, and Settings.",
        ],
    },
    {
        "title": "1. Create An Account",
        "description": "Every dashboard feature is tied to a user account. After registration, the app creates your first conversation automatically so you can start chatting right away.",
        "example": "Register with name, email, and password, then use the returned Bearer token in the web app.",
        "highlights": [
            "POST /auth/register creates the user and returns a session token.",
            "POST /auth/login signs existing users back in.",
            "GET /auth/me restores the logged-in session on page refresh.",
        ],
    },
    {
        "title": "2. Session Memory",
        "description": "Chats are stored per user and per session in MongoDB. When you ask a follow-up question, the backend pulls recent messages from the active session and feeds that memory into the RAG prompt.",
        "example": "Ask 'What are symptoms of diabetes?' and then ask 'What about diet control?' in the same session.",
        "highlights": [
            "Open the Chat page and click New Chat to start a separate consultation.",
            "Select any existing session from the session list to continue an older conversation.",
            "Type a question and press Enter or click the send button.",
            "Ask follow-up questions in the same session so MediBot can use recent conversation memory.",
            "POST /sessions creates a new private conversation.",
            "GET /sessions lists saved conversations for the current user.",
            "POST /ask accepts question + session_id and stores both user and bot messages.",
        ],
    },
    {
        "title": "3. Production API Keys",
        "description": "Users can generate API keys from the API SDK page and use them in external apps, servers, or scripts. Production requests authenticate with the X-API-Key header instead of a browser session token.",
        "example": "Create a key named 'My Clinic App' and call the production /ask endpoint from Python or cURL.",
        "highlights": [
            "Open API SDK from the sidebar.",
            "Enter a key name and click Create API Key.",
            "Copy the raw key immediately because it is only shown once.",
            "Use that key in your own backend, script, mobile app, or automation with the X-API-Key header.",
            "GET /developer/api-keys lists all keys for the logged-in user.",
            "POST /developer/api-keys creates a new key and reveals the raw token once.",
            "DELETE /developer/api-keys/{key_id} revokes a key without deleting history.",
        ],
    },
    {
        "title": "4. File Analysis Workflows",
        "description": "Uploads stay behind authentication as well. Prescription OCR, medical query extraction, and image-based disease analysis all run through protected endpoints tied to the current user.",
        "example": "Upload a prescription image to /upload or a medical condition image to /vision.",
        "highlights": [
            "Open Upload from the sidebar.",
            "Drag and drop a file or click the upload area to choose one.",
            "Click Analyze Document to process the file.",
            "Review the extracted text, generated medical query, and final explanation in the result panel.",
            "POST /upload extracts text, builds a medical query, and returns an explanation.",
            "POST /vision captions the image and returns a medical analysis.",
            "These endpoints accept multipart/form-data and require Bearer or API-key auth.",
        ],
    },
    {
        "title": "5. Analytics And History",
        "description": "The dashboard no longer uses placeholder data. Analytics and history are calculated from real stored chats, sessions, and questions for the current account.",
        "example": "Open History to search saved questions or Analytics to view your last 7 days of usage.",
        "highlights": [
            "Open History to search previous questions and review stored answers.",
            "Open Analytics to see total queries, sessions, answered messages, and your weekly usage chart.",
            "Use these pages to understand how often you use MediBot and which medical topics appear most often.",
            "GET /history returns searchable saved user questions and answers.",
            "GET /analytics returns dynamic per-user stats, chart values, and topic breakdowns.",
            "Topic categories are inferred from the content of stored questions.",
        ],
    },
    {
        "title": "6. Best Practices",
        "description": "MediBot is most useful when sessions are kept organized and prompts are specific.",
        "example": "Use separate sessions for diabetes, prescriptions, and lab report questions instead of mixing everything into one long chat.",
        "highlights": [
            "Create separate sessions for different patients or different medical topics.",
            "Upload clear images for better OCR and visual analysis results.",
            "Use API keys only on trusted servers or secure environments.",
            "Treat responses as assistant guidance and confirm important medical decisions with a licensed doctor.",
        ],
    },
]


@app.on_event("startup")
def on_startup():
    ensure_indexes()


def issue_auth_response(user):
    raw_token, token_digest, expires_at = create_session_token()
    store_auth_token(str(user["_id"]), token_digest, expires_at)
    return {
        "token": raw_token,
        "expires_at": expires_at.isoformat(),
        "user": serialize_user(user),
    }


@router.post("/auth/register")
def register(payload: AuthPayload):
    if "@" not in payload.email:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if not payload.name or not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required.")

    existing = find_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    salt, password_hash = hash_password(payload.password)
    user = create_user(payload.name.strip(), payload.email, salt, password_hash)
    create_chat_session(str(user["_id"]), "General Consultation")
    return issue_auth_response(user)


@router.post("/auth/login")
def login(payload: AuthPayload):
    if "@" not in payload.email:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    user = find_user_by_email(payload.email)
    if not user or not verify_password(payload.password, user["password_salt"], user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return issue_auth_response(user)


@router.get("/auth/me")
def get_me(current_user=Depends(get_current_user)):
    return {"user": serialize_user(current_user)}


@router.put("/auth/me")
def update_me(payload: UpdateUserPayload, current_user=Depends(get_current_user)):
    if "@" not in payload.email:
        raise HTTPException(status_code=400, detail="Enter a valid email address.")

    existing = find_user_by_email(payload.email)
    if existing and str(existing["_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    updated_user = update_user_profile(
        str(current_user["_id"]),
        payload.name.strip(),
        payload.email,
    )

    return {"user": serialize_user(updated_user)}


@router.post("/auth/logout")
def logout(
    current_user=Depends(get_current_user),
    authorization: str = Header(default=""),
):
    if authorization.startswith("Bearer "):
        delete_auth_token(hash_token(authorization.split(" ", 1)[1].strip()))
    return {"ok": True}


@router.get("/developer/api-keys")
def list_api_keys(current_user=Depends(get_current_user)):
    return {"api_keys": get_user_api_keys(str(current_user["_id"]))}


@router.post("/developer/api-keys")
def create_developer_api_key(
    payload: CreateApiKeyPayload,
    current_user=Depends(get_current_user),
):
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="API key name is required.")

    raw_key, key_hash = create_api_key()
    prefix = raw_key[:12]
    last4 = raw_key[-4:]
    api_key = store_api_key(
        str(current_user["_id"]),
        name,
        key_hash,
        prefix,
        last4,
    )
    return {
        "api_key": {
            **serialize_api_key(api_key),
            "token": raw_key,
        }
    }


@router.delete("/developer/api-keys/{key_id}")
def delete_developer_api_key(key_id: str, current_user=Depends(get_current_user)):
    revoke_api_key(str(current_user["_id"]), key_id)
    return {"ok": True}


@router.post("/sessions")
def create_session(payload: CreateSessionPayload, current_user=Depends(get_current_user)):
    title = payload.title.strip() if payload.title else "New Consultation"
    session = create_chat_session(str(current_user["_id"]), title)
    return {"session": serialize_session(session)}


@router.get("/sessions")
def get_sessions(current_user=Depends(get_current_user)):
    return {"sessions": get_user_sessions(str(current_user["_id"]))}


@router.get("/sessions/{session_id}/messages")
def get_messages(session_id: str, current_user=Depends(get_current_user)):
    session = get_session_for_user(str(current_user["_id"]), session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    return {"messages": get_session_messages(session_id)}


@router.delete("/sessions/{session_id}")
def delete_session_endpoint(session_id: str, current_user=Depends(get_current_user)):
    session = get_session_for_user(str(current_user["_id"]), session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found.")
    
    success = delete_session(str(current_user["_id"]), session_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete session.")
    
    return {"message": "Session deleted successfully."}




@router.get("/auth/google")
async def google_login(request: Request):
    redirect_uri = str(request.base_url) + "api/auth/google/callback"
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/auth/google/callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token["userinfo"]
        email   = user_info["email"]
        name    = user_info["name"]
        picture = user_info.get("picture", "")

        # Find or create user
        user_db = find_user_by_email(email)
        if not user_db:
            salt, password_hash = hash_password(secrets.token_hex(16))
            user_db = create_user(
                name,
                email,
                salt,
                password_hash,
                picture
            )
            create_chat_session(str(user_db["_id"]), "General Consultation")

        # Issue session token
        raw_token, token_digest, expires_at = create_session_token()
        store_auth_token(str(user_db["_id"]), token_digest, expires_at)

        # Redirect to frontend with token
        return RedirectResponse(
            f"{FRONTEND_URL}/auth-success?token={raw_token}"
        )
    except Exception as e:
        return RedirectResponse(
            f"{FRONTEND_URL}?error=google_auth_failed"
        )

@router.get("/history")
def get_history(current_user=Depends(get_current_user)):
    return {"conversations": get_user_history(str(current_user["_id"]))}


@router.post("/ask")
def ask(query: Query, current_user=Depends(get_current_user)):
    session_id = query.session_id
    created_new_session = False
    if session_id:
        session = get_session_for_user(str(current_user["_id"]), session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")
    else:
        session = create_chat_session(str(current_user["_id"]), build_session_title(query.question))
        session_id = str(session["_id"])
        created_new_session = True

    from .services.rag import rag_answer

    user_message = create_message(str(current_user["_id"]), session_id, "user", query.question)
    memory = get_session_memory(session_id)
    answer = rag_answer(query.question, memory=memory)
    assistant_message = create_message(str(current_user["_id"]), session_id, "bot", answer)

    if created_new_session or session["title"] in {"New Consultation", "General Consultation"}:
        touch_session(session_id, build_session_title(query.question))
    else:
        touch_session(session_id)

    return {
        "answer": answer,
        "session": serialize_session(get_session_for_user(str(current_user["_id"]), session_id)),
        "user_message": serialize_message(user_message),
        "assistant_message": serialize_message(assistant_message),
    }


@router.post("/upload")
async def upload_prescription(file: UploadFile = File(...), current_user=Depends(get_current_user)):
    from .services.ocr import extract_text
    from .services.rag import rag_answer, llm  # ✅ import llm

    allowed = ["image/jpeg", "image/png", "image/jpg", "application/pdf"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Empty file received.")

    # Extract text from file
    extracted_text = extract_text(file_bytes, content_type=file.content_type)

    if not extracted_text.strip():
        raise HTTPException(status_code=422, detail="Could not extract any text from the file.")

    # ✅ Use LLM to intelligently extract medical query
    from .services.ocr import extract_medical_query
    medical_query = extract_medical_query(extracted_text, llm)

    # Get RAG answer based on extracted medical info
    answer = rag_answer(medical_query)

    return {
        "extracted_text": extracted_text,
        "query_used": medical_query,
        "explanation": answer,
        "user_id": str(current_user["_id"]),
    }


@router.post("/vision")
async def disease_detection(
    file: UploadFile = File(...),
    session_id: str | None = Form(None),
    question: str | None = Form(None),
    current_user=Depends(get_current_user),
):
    from PIL import Image
    from .services.vision import get_disease_analysis
    from .services.rag import rag_answer

    contents = await file.read()
    
    # ✅ Save image to disk
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)
    image_url = f"/uploads/{filename}"  # accessible via browser
    
    image = Image.open(io.BytesIO(contents)).convert("RGB")
    caption, analysis = get_disease_analysis(image)

    persist_in_chat = session_id is not None or question is not None
    question_text = (question or "").strip()

    if not persist_in_chat:
        return {
            "image_description": caption,
            "analysis": analysis,
            "user_id": str(current_user["_id"]),
        }

    created_new_session = False
    session = None
    resolved_session_id = session_id

    if resolved_session_id:
        session = get_session_for_user(str(current_user["_id"]), resolved_session_id)
        if not session:
            raise HTTPException(status_code=404, detail="Session not found.")

    if not session:
        title_seed = question_text or "Disease Image Review"
        session = create_chat_session(str(current_user["_id"]), build_session_title(title_seed))
        resolved_session_id = str(session["_id"])
        created_new_session = True

    user_text = question_text or "Please review this disease image."
    stored_user_text = f"{user_text}\n\n[Attached disease image for visual analysis]"

    final_answer = analysis
    if question_text:
        memory = get_session_memory(resolved_session_id)
        follow_up_prompt = f"""The user uploaded a disease image and asked a follow-up question.

User question: {question_text}
Image description: {caption}
Initial visual analysis: {analysis}

Provide a medically cautious answer that uses the image findings, mentions uncertainty where needed, and recommends professional care when appropriate.
"""
        follow_up_answer = rag_answer(follow_up_prompt, memory=memory)
        final_answer = f"""Image description: {caption}

Visual analysis:
{analysis}

Follow-up answer:
{follow_up_answer}"""

    user_message = create_message(
        str(current_user["_id"]),
        resolved_session_id,
        "user",
        stored_user_text,
        image_url=image_url,  # ← pass image URL
    )
    assistant_message = create_message(str(current_user["_id"]), resolved_session_id, "bot", final_answer)

    if created_new_session:
        touch_session(resolved_session_id, build_session_title(user_text))
    else:
        touch_session(resolved_session_id)

    return {
        "image_description": caption,
        "analysis": analysis,
        "answer": final_answer,
        "user_id": str(current_user["_id"]),
        "session": serialize_session(get_session_for_user(str(current_user["_id"]), resolved_session_id)),
        "user_message": serialize_message(user_message),
        "assistant_message": serialize_message(assistant_message),
    }


@app.get("/")
def root():
    return {"message": "Medical RAG API running"}


@router.get("/analytics")
def get_analytics(current_user=Depends(get_current_user)):
    return get_user_analytics(str(current_user["_id"]))


@router.get("/settings")
def get_settings(current_user=Depends(get_current_user)):
    settings_doc = get_user_settings(str(current_user["_id"]))
    return serialize_settings(settings_doc, settings_defaults)


@router.put("/settings")
def update_settings(payload: UpdateSettingsPayload, current_user=Depends(get_current_user)):
    allowed_models = {item["name"] for item in models}
    if payload.model not in allowed_models:
        raise HTTPException(status_code=400, detail="Invalid model selected.")

    settings_doc = upsert_user_settings(
        str(current_user["_id"]),
        {
            "darkMode": payload.darkMode,
            "notifications": payload.notifications,
            "autoSave": payload.autoSave,
            "medicalDisclaimer": payload.medicalDisclaimer,
            "model": payload.model,
        },
    )
    return serialize_settings(settings_doc, settings_defaults)


@router.get("/initial_message")
def get_initial_message():
    return initial_message


@router.get("/suggestions")
def get_suggestions():
    return {"suggestions": suggestions}


@router.get("/upload_types")
def get_upload_types():
    return {"types": upload_types}


@router.get("/models")
def get_models():
    return {"models": models}


@router.get("/api_info")
def get_api_info():
    return {"info": api_info}


@router.get("/about")
def get_about():
    return about


@router.get("/plans")
def get_plans():
    return {"plans": plans}


@router.get("/api_sdk")
def get_api_sdk(current_user=Depends(get_current_user)):
    session_id = None
    sessions = get_user_sessions(str(current_user["_id"]))
    if sessions:
        session_id = sessions[0]["id"]

    return {
        "base_url": PRODUCTION_API_BASE,
        "sample_session_id": session_id,
        "python": api_sdk["python"].replace("BASE_URL_PLACEHOLDER", PRODUCTION_API_BASE),
        "javascript": api_sdk["javascript"].replace("BASE_URL_PLACEHOLDER", PRODUCTION_API_BASE),
        "curl": api_sdk["curl"].replace("BASE_URL_PLACEHOLDER", PRODUCTION_API_BASE),
    }


@app.get("/docs")
def get_docs():
    return {"use_cases": docs}


app.include_router(router)
