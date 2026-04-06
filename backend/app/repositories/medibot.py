from collections import Counter
from datetime import datetime, timedelta,timezone

from ..db.mongodb import DESCENDING, get_database
from ..core.security import utc_now

try:
    from bson import ObjectId
except ImportError:  # pragma: no cover - handled at runtime via pymongo dependency
    ObjectId = None


def require_object_id(value: str):
    if ObjectId is None:
        raise RuntimeError("bson is unavailable because pymongo is not installed.")
    return ObjectId(value)


def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"].isoformat(),
    }


def serialize_session(session):
    return {
        "id": str(session["_id"]),
        "title": session["title"],
        "created_at": session["created_at"].isoformat(),
        "updated_at": session["updated_at"].isoformat(),
    }


def serialize_message(message):
    return {
        "id": str(message["_id"]),
        "role": message["role"],
        "text": message["text"],
        "image_url": message.get("image_url"),  # ✅ include in response
        "time": message["created_at"].strftime("%I:%M %p"),
        "created_at": message["created_at"].isoformat(),
    }


def build_history_entry(message, answer_text, session_title):
    created_at = message["created_at"]
    return {
        "session_id": str(message["session_id"]),
        "session_title": session_title,
        "q": message["text"],
        "a": answer_text,
        "date": created_at.strftime("%b %d, %I:%M %p"),
        "tag": session_title,
    }


def create_user(name: str, email: str, password_salt: str, password_hash: str,provider="email",picture=""):
    db = get_database()
    now = utc_now()
    doc = {
        "name": name,
        "email": email.lower(),
        "password_salt": password_salt,
        "password_hash": password_hash,
        "provider":      provider,
        "picture":       picture,
        "created_at": now,
    }
    result = db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_user_settings(user_id: str):
    return get_database().user_settings.find_one({"user_id": require_object_id(user_id)})


def upsert_user_settings(user_id: str, settings: dict):
    now = utc_now()
    update_fields = {**settings, "updated_at": now}
    get_database().user_settings.update_one(
        {"user_id": require_object_id(user_id)},
        {
            "$set": update_fields,
            "$setOnInsert": {
                "user_id": require_object_id(user_id),
                "created_at": now,
            },
        },
        upsert=True,
    )
    return get_user_settings(user_id)


def serialize_settings(settings_doc, defaults: dict):
    values = dict(defaults)
    if settings_doc:
        for key in defaults:
            if key in settings_doc:
                values[key] = settings_doc[key]
    return {
        **values,
        "created_at": settings_doc["created_at"].isoformat() if settings_doc and settings_doc.get("created_at") else None,
        "updated_at": settings_doc["updated_at"].isoformat() if settings_doc and settings_doc.get("updated_at") else None,
    }


def find_user_by_email(email: str):
    return get_database().users.find_one({"email": email.lower()})


def find_user_by_id(user_id: str):
    return get_database().users.find_one({"_id": require_object_id(user_id)})


def update_user_profile(user_id: str, name: str, email: str):
    get_database().users.update_one(
        {"_id": require_object_id(user_id)},
        {"$set": {"name": name, "email": email.lower()}},
    )
    return find_user_by_id(user_id)


def store_auth_token(user_id: str, token_hash: str, expires_at):
    get_database().auth_tokens.insert_one(
        {
            "user_id": require_object_id(user_id),
            "token_hash": token_hash,
            "created_at": utc_now(),
            "expires_at": expires_at,
        }
    )


def find_auth_token(token_hash: str):
    return get_database().auth_tokens.find_one({"token_hash": token_hash})


def delete_auth_token(token_hash: str):
    get_database().auth_tokens.delete_one({"token_hash": token_hash})


def store_api_key(user_id: str, name: str, key_hash: str, prefix: str, last4: str):
    doc = {
        "user_id": require_object_id(user_id),
        "name": name,
        "key_hash": key_hash,
        "prefix": prefix,
        "last4": last4,
        "revoked": False,
        "created_at": utc_now(),
        "last_used_at": None,
    }
    result = get_database().api_keys.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def serialize_api_key(api_key):
    return {
        "id": str(api_key["_id"]),
        "name": api_key["name"],
        "prefix": api_key["prefix"],
        "last4": api_key["last4"],
        "revoked": api_key["revoked"],
        "created_at": api_key["created_at"].isoformat(),
        "last_used_at": api_key["last_used_at"].isoformat() if api_key["last_used_at"] else None,
        "masked_key": f"{api_key['prefix']}...{api_key['last4']}",
    }


def get_user_api_keys(user_id: str):
    cursor = get_database().api_keys.find({"user_id": require_object_id(user_id)}).sort(
        "created_at", DESCENDING
    )
    return [serialize_api_key(api_key) for api_key in cursor]


def find_api_key(key_hash: str):
    return get_database().api_keys.find_one({"key_hash": key_hash})


def touch_api_key_usage(key_hash: str):
    get_database().api_keys.update_one(
        {"key_hash": key_hash},
        {"$set": {"last_used_at": utc_now()}},
    )


def revoke_api_key(user_id: str, key_id: str):
    get_database().api_keys.update_one(
        {"_id": require_object_id(key_id), "user_id": require_object_id(user_id)},
        {"$set": {"revoked": True}},
    )


def create_chat_session(user_id: str, title: str = "New Consultation"):
    db = get_database()
    now = utc_now()
    doc = {
        "user_id": require_object_id(user_id),
        "title": title,
        "created_at": now,
        "updated_at": now,
        "last_message_at": now,
    }
    result = db.chat_sessions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_user_sessions(user_id: str):
    cursor = get_database().chat_sessions.find(
        {"user_id": require_object_id(user_id)}
    ).sort("updated_at", DESCENDING)
    return [serialize_session(session) for session in cursor]


def get_session_for_user(user_id: str, session_id: str):
    return get_database().chat_sessions.find_one(
        {"_id": require_object_id(session_id), "user_id": require_object_id(user_id)}
    )


def touch_session(session_id: str, title: str | None = None):
    update_doc = {
        "updated_at": utc_now(),
        "last_message_at": utc_now(),
    }
    if title:
        update_doc["title"] = title
    get_database().chat_sessions.update_one(
        {"_id": require_object_id(session_id)},
        {"$set": update_doc},
    )


def delete_session(user_id: str, session_id: str):
    # Delete the session and all its messages
    db = get_database()
    # First delete all messages in the session
    db.messages.delete_many({
        "user_id": require_object_id(user_id),
        "session_id": require_object_id(session_id)
    })
    # Then delete the session itself
    result = db.chat_sessions.delete_one({
        "_id": require_object_id(session_id),
        "user_id": require_object_id(user_id)
    })
    return result.deleted_count > 0


def create_message(user_id: str, session_id: str, role: str, text: str, created_at=None,image_url=None):
    db = get_database()
    doc = {
        "user_id": require_object_id(user_id),
        "session_id": require_object_id(session_id),
        "role": role,
        "text": text,
        "image_url": image_url,
        "created_at": created_at or utc_now(),
    }
    result = db.messages.insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


def get_session_messages(session_id: str, limit: int | None = None):
    db = get_database()
    cursor = db.messages.find({"session_id": require_object_id(session_id)}).sort(
        "created_at", 1
    )
    messages = list(cursor)
    if limit is not None:
        messages = messages[-limit:]
    return [serialize_message(message) for message in messages]


def get_recent_memory(session_id: str, limit: int = 8):
    db = get_database()
    messages = list(
        db.messages.find({"session_id": require_object_id(session_id)})
        .sort("created_at", DESCENDING)
        .limit(limit)
    )
    messages.reverse()
    return messages


def get_user_history(user_id: str, limit: int = 50):
    db = get_database()
    messages = list(
        db.messages.find(
            {"user_id": require_object_id(user_id), "role": "user"}
        ).sort("created_at", DESCENDING).limit(limit)
    )

    history = []
    for message in messages:
        answer = db.messages.find_one(
            {
                "session_id": message["session_id"],
                "role": "bot",
                "created_at": {"$gte": message["created_at"]},
            },
            sort=[("created_at", 1)],
        )
        session = db.chat_sessions.find_one({"_id": message["session_id"]})
        history.append(
            build_history_entry(
                message,
                answer["text"] if answer else "",
                session["title"] if session else "Conversation",
            )
        )

    return history


from collections import Counter
from datetime import datetime, timedelta
from langchain_cohere import ChatCohere
import json
from dotenv import load_dotenv
load_dotenv()
import os

COHERE_API_KEY = os.getenv("COHERE_API_KEY")

if COHERE_API_KEY:
    os.environ["COHERE_API_KEY"] = COHERE_API_KEY
# ── Dynamic topic classifier using LLM ──────────────────────────
_classifier_llm = ChatCohere(model="command-a-03-2025", temperature=0, max_tokens=50)

TOPIC_COLORS = {
    "Cardiology":     "#22d3a0",
    "Medication":     "#f7c948",
    "Lab Reports":    "#b46ef7",
    "Diabetes":       "#f76b6b",
    "Dermatology":    "#f7a848",
    "Mental Health":  "#6b9ef7",
    "Nutrition":      "#48f7a8",
    "General Health": "#4f8ef7",
    "Other":          "#6b7691",
}

def classify_topic(text: str) -> str:
    """Use LLM to dynamically classify any medical text into a topic."""
    if not text or len(text.strip()) < 3:
        return "Other"
    try:
        prompt = f"""Classify this medical message into exactly ONE of these topics:
Cardiology, Medication, Lab Reports, Diabetes, Dermatology, Mental Health, Nutrition, General Health, Other

Message: {text[:200]}

Reply with ONLY the topic name, nothing else."""
        response = _classifier_llm.invoke(prompt)
        topic = response.content.strip()
        # Validate it's one of our known topics
        if topic in TOPIC_COLORS:
            return topic
        return "Other"
    except Exception:
        return "Other"

# ── Batch classify to avoid too many API calls ──────────────────
def classify_topics_batch(messages: list) -> list:
    """Classify multiple messages in one LLM call."""
    if not messages:
        return []
    try:
        texts = "\n".join([f"{i+1}. {m['text'][:100]}" for i, m in enumerate(messages)])
        prompt = f"""Classify each message into ONE topic from:
Cardiology, Medication, Lab Reports, Diabetes, Dermatology, Mental Health, Nutrition, General Health, Other

Messages:
{texts}

Reply with ONLY a JSON array of topic strings in the same order.
Example: ["Cardiology", "Medication", "Other"]
No extra text."""
        response = _classifier_llm.invoke(prompt)
        raw = response.content.strip()
        # Clean up response
        raw = raw.replace("```json", "").replace("```", "").strip()
        topics = json.loads(raw)
        # Validate each topic
        return [t if t in TOPIC_COLORS else "Other" for t in topics]
    except Exception:
        # Fallback to individual classification
        return [classify_topic(m["text"]) for m in messages]


def get_user_analytics(user_id: str):
    db = get_database()
    user_object_id = require_object_id(user_id)
    now = datetime.utcnow()
    start_of_window = now - timedelta(days=6)
    previous_window_start = start_of_window - timedelta(days=7)

    user_messages = list(
        db.messages.find({"user_id": user_object_id, "role": "user"}).sort("created_at", 1)
    )
    bot_messages = list(
        db.messages.find({"user_id": user_object_id, "role": "bot"}).sort("created_at", 1)
    )
    sessions = list(db.chat_sessions.find({"user_id": user_object_id}))

    total_queries = len(user_messages)
    total_sessions = len(sessions)

    answered_queries = sum(1 for message in user_messages if any(
        bot["session_id"] == message["session_id"] and bot["created_at"] >= message["created_at"]
        for bot in bot_messages
    ))

    avg_messages_per_session = round(total_queries / total_sessions, 1) if total_sessions else 0

    def to_naive(dt):
        return dt.replace(tzinfo=None) if dt.tzinfo else dt

    current_week_messages = [
        m for m in user_messages if to_naive(m["created_at"]) >= start_of_window
    ]
    previous_week_messages = [
        m for m in user_messages
        if previous_window_start <= to_naive(m["created_at"]) < start_of_window
    ]

    def calc_delta(current_count: float, previous_count: float):
        if previous_count == 0:
            return 100 if current_count > 0 else 0
        return round(((current_count - previous_count) / previous_count) * 100)

    # Chart
    chart_days = []
    chart_values = []
    for offset in range(7):
        day_start = start_of_window + timedelta(days=offset)
        day_end = day_start + timedelta(days=1)
        chart_days.append(day_start.strftime("%a"))
        chart_values.append(
            sum(1 for m in user_messages if day_start <= to_naive(m["created_at"]) < day_end)
        )

    # ✅ Dynamic batch classification — one LLM call for all messages
    if user_messages:
        classified_topics = classify_topics_batch(user_messages)
        topic_counts = Counter(classified_topics)
    else:
        topic_counts = Counter()

    total_topics = sum(topic_counts.values()) or 1
    topics = [
        {
            "name": topic,
            "pct": round((count / total_topics) * 100),
            "color": TOPIC_COLORS.get(topic, TOPIC_COLORS["Other"]),
        }
        for topic, count in topic_counts.most_common(5)
    ]

    if not topics:
        topics = [{"name": "Other", "pct": 100, "color": TOPIC_COLORS["Other"]}]

    stats = [
        {"label": "Total Queries",        "value": str(total_queries),            "delta": calc_delta(len(current_week_messages), len(previous_week_messages)), "icon": "💬", "color": "#4f8ef7"},
        {"label": "Chat Sessions",         "value": str(total_sessions),           "delta": 0, "icon": "🧠", "color": "#22d3a0"},
        {"label": "Answered Queries",      "value": str(answered_queries),         "delta": 0, "icon": "✅", "color": "#f7c948"},
        {"label": "Avg Queries / Session", "value": str(avg_messages_per_session), "delta": 0, "icon": "📈", "color": "#b46ef7"},
    ]

    return {
        "stats": stats,
        "topics": topics,
        "chart": {"days": chart_days, "values": chart_values},
    }
