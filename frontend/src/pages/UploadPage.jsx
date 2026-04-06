import React, { useState, useEffect, useRef } from 'react';
import { C } from '../constants/constants';
import Badge from '../components/Badge';

function UploadPage({ token }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadTypes, setUploadTypes] = useState([]);
  const inputRef = useRef(null);

useEffect(() => {
    if (!token) return;
    fetch("/api/upload_types", {          // ✅ fixed
        headers: { Authorization: `Bearer ${token}` }
    })
    .then((res) => res.json())
    .then((data) => setUploadTypes(data.types || []));  // ✅ extract array
}, [token]);

const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);         // ✅ field name must be "file"

    try {
        const res = await fetch("/api/upload", {   // ✅ fixed
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        const data = await res.json();
        if (res.ok) {
            setResult(data);
        } else {
            setResult({ error: data.detail || "Upload failed" });
        }
    } catch (err) {
        setResult({ error: "Network error" });
    }
    setLoading(false);
};


  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "32px 40px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {uploadTypes.map((type) => (
          <Badge key={type.name} color={type.color}>
            {type.name}
          </Badge>
        ))}
      </div>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          const droppedFile = event.dataTransfer.files?.[0];
          if (droppedFile) setFile(droppedFile);
        }}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragging ? C.accent : C.borderHi}`,
          borderRadius: 24,
          padding: "64px 40px",
          background: dragging ? C.accentSoft : C.card,
          textAlign: "center",
          cursor: "pointer",
        }}
      >
        <div style={{ fontSize: 46, marginBottom: 14 }}>📄</div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, fontSize: 20 }}>
          {file ? file.name : "Drop a prescription or report here"}
        </div>
        <div style={{ color: C.textMuted, marginTop: 10 }}>
          {file ? `${(file.size / 1024).toFixed(1)} KB ready to upload` : "Supported: JPG, PNG, PDF"}
        </div>
        <input ref={inputRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={(event) => setFile(event.target.files?.[0] || null)} />
      </div>

      {file && (
        <button
          onClick={analyze}
          disabled={loading}
          style={{
            alignSelf: "flex-start",
            padding: "14px 24px",
            borderRadius: 14,
            border: "none",
            background: `linear-gradient(135deg, ${C.accent}, #6b5ef7)`,
            color: "#fff",
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {loading ? "Analyzing..." : "Analyze Document"}
        </button>
      )}

      {result && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 24 }}>
          {result.error ? (
            <div style={{ color: C.red }}>{result.error}</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: C.green }}>Extracted text</div>
                <div style={{ color: C.textMuted }}>{result.extracted_text}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: C.yellow }}>Query used</div>
                <div style={{ color: C.textMuted }}>{result.query_used}</div>
              </div>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6, color: C.accent }}>Explanation</div>
                <div>{result.explanation}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default UploadPage;