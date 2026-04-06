from ..repositories.medibot import get_recent_memory


def build_memory_prompt(messages):
    if not messages:
        return ""

    lines = []
    for message in messages:
        role = "User" if message["role"] == "user" else "Assistant"
        lines.append(f"{role}: {message['text']}")
    return "\n".join(lines)


def build_session_title(question: str):
    cleaned = " ".join(question.split())
    if not cleaned:
        return "New Consultation"
    return cleaned[:40] + ("..." if len(cleaned) > 40 else "")


def get_session_memory(session_id: str):
    messages = get_recent_memory(session_id, limit=8)
    return build_memory_prompt(messages)
