import { useState } from "react";

export default function InputBar({ onSend, loading }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div style={styles.container}>
      <input
        style={styles.input}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSend()}
        placeholder="Type your question..."
        disabled={loading}
      />
      <button style={styles.button} onClick={handleSend} disabled={loading}>
        {loading ? "..." : "Send"}
      </button>
    </div>
  );
}

const styles = {
  container: { display:"flex", gap:8, padding:"12px 16px",
    borderTop:"1px solid #e2e8f0", background:"white" },
  input: { flex:1, padding:"10px 14px", borderRadius:24,
    border:"1px solid #cbd5e0", outline:"none", fontSize:14 },
  button: { padding:"10px 20px", borderRadius:24, background:"#0077cc",
    color:"white", border:"none", cursor:"pointer", fontWeight:600 }
};