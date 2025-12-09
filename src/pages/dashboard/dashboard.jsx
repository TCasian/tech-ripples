import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "../../services/supabaseClient.js";
import "./dashboard.css";
export default function Dashboard() {
  const navigate = useNavigate();
  const client = new SupabaseClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const u = await client.getUser();
        setUser(u);
      } catch {}
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
    <div className="container-info">
      <header className="header">
        <div className="logo-section">
          <img src="Logo.svg" alt="Logo" className="logo-img" />
          <span className="logo-title">TechRipples</span>
        </div>
        <nav className={`nav active`}>
          <div
            className="nav-item"
            style={{ fontWeight: "bold", fontSize: "2em" }}
          >
            DASHBOARD
          </div>
        </nav>

        <div className="icons">
          <div className="icon" style={{ width: "4.5em" }}></div>
        </div>
      </header>
    </div>
  );
}
