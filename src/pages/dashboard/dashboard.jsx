import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "../../services/supabaseClient.js";

export default function Dashboard() {
  const navigate = useNavigate();
  const client = new SupabaseClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await client.getUser();
        if (!u) navigate("/login");
        setUser(u);
      } catch {
        navigate("/login");
      }
    }
    fetchUser();
  }, []);

  const signOut = async () => {
    await client.signOut();
    localStorage.clear();
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        color: "white",
        background: "#111",
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
              borderRadius: 6,
              border: "none",
              backgroundColor: "#ff4444",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </>
      ) : (
        <p>Caricamento utente...</p>
      )}
    </div>
  );
}
