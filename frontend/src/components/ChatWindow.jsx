import { useEffect, useRef, useState } from "react";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ messages, onImageUpload }) {
  const bottomRef = useRef(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSendImage = () => {
    if (imageFile && onImageUpload) {
      onImageUpload(imageFile);
      setImageFile(null);
      setImagePreview(null);
    }
  };

  return (
    <div style={{ flex:1, overflowY:"auto", padding:"16px 20px", background:"#f7fafc" }}>
      {messages.map((msg, i) => <MessageBubble key={i} message={msg} />)}
      {imagePreview && (
        <div style={{ margin: "10px 0", textAlign: "center" }}>
          <img src={imagePreview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "8px" }} />
          <button onClick={handleSendImage} style={{ marginTop: "10px", padding: "8px 16px", background: "#007bff", color: "white", border: "none", borderRadius: "4px" }}>
            Send Image
          </button>
        </div>
      )}
      <div style={{ margin: "10px 0" }}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      </div>
      <div ref={bottomRef} />
    </div>
  );
}