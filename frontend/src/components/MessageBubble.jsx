export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div style={{ display:"flex", justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom:12 }}>
      <div style={{
        maxWidth:"75%", padding:"10px 14px", borderRadius: isUser
          ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
        background: isUser ? "#0077cc" : "#f0f4f8",
        color: isUser ? "white" : "#1a1a2e", fontSize:14, lineHeight:1.5
      }}>
        {message.text}
      </div>
    </div>
  );
}