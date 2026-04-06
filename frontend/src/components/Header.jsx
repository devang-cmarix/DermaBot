export default function Header() {
  return (
    <div style={styles.header}>
      <div style={styles.avatar}>🩺</div>
      <div>
        <div style={styles.name}>Medical Assistant</div>
        <div style={styles.status}>● Online</div>
      </div>
    </div>
  );
}

const styles = {
  header: { display:"flex", alignItems:"center", gap:12, padding:"16px 20px",
    background:"#0077cc", color:"white" },
  avatar: { fontSize:28, background:"white", borderRadius:"50%",
    width:44, height:44, display:"flex", alignItems:"center", justifyContent:"center" },
  name: { fontWeight:700, fontSize:16 },
  status: { fontSize:12, color:"#a8d8ff" }
};