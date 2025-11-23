import { supabaseClient } from "../../services/supabaseClient.js";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
      } else {
        setUser(data.user);
      }
    }
    fetchUser();
  }, [navigate]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("❌ Errore durante il logout:", error.message);
    } else {
      console.log("✅ Logout avvenuto con successo");
      localStorage.clear(); // se salvi cose extra
      sessionStorage.clear();
      if (window.google && window.google.accounts?.id) {
        window.google.accounts.id.disableAutoSelect();
        window.google.accounts.id.revoke(email, () => {
          console.log("🔒 Sessione Google revocata");
        });
      }
      navigate("/login");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0a0a0a, #1f1f1f)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <h1>Dashboard</h1>
      {user ? (
        <>
          <p>
            Benvenuto, <strong>{user.email}</strong>
          </p>
          <button
            onClick={signOut}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: "#ff4444",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "20px",
              transition: "background 0.3s ease",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#ff6666")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#ff4444")}
          >
            Sign Out
          </button>
        </>
      ) : (
        <div>
          <p>Caricamento utente...</p>
          <button onClick={signOut}> esci </button>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
