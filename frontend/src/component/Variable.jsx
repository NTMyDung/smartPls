
// Component cho biến 
export default function Variable({ variables }) {
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", textAlign: "center", justifyContent: "center"}}>
        {variables.map(v => (
            <div 
                key={v}
                style={{
                    padding: "0.5rem 2.5rem",
                    background: "#1e3a8a",
                    color: "white",
                    borderRadius: "6px",
                    fontWeight: "bold",
                    fontSize: "14px",
                    minWidth: "60px",
                    textAlign: "center",
                    marginRight: "3rem",
                }}
                >
                {v}
            </div>
        ))}
    </div>
  );
}
