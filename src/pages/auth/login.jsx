import React from "react";
import "./auth.css";
import { useEffect, useState } from "react";
import { supabaseClient } from "../../services/supabaseClient.js";
import PixelBlast from "./PixelBlast";
import { Link, useNavigate } from "react-router-dom";
import Typewriter from "../../componenti/Typewriter.jsx";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    const client = new SupabaseClient();

    try {
      const { data, error } = await client.sign_in(email, password);
      if (error) {
        setMessage(`Errore: ${error.message}`);
      } else {
        setMessage("Login avvenuto con successo!");
      }
    } catch (err) {
      setMessage(`Errore: ${err.message}`);
    }
  };

  return (
    <div className="container-auth">
      <PixelBlast
        variant="circle"
        pixelSize={6}
        patternScale={3}
        patternDensity={1.2}
        pixelSizeJitter={0.5}
        rippleThickness={0.12}
        rippleIntensityScale={1.5}
        liquid
        liquidStrength={0}
        liquidRadius={1.2}
        liquidWobbleSpeed={5}
        speed={0.6}
        edgeFade={0.25}
        transparent
      />
      <script src="https://accounts.google.com/gsi/client" async></script>

      <div className="info-container">
        <img src="Logo.svg" alt="Logo" className="logo" />
        <h1 className="info-text">TECH RIPPLES</h1>
        <Typewriter
          strings={[
            "Write. Share. Earn. All about tech.",
            "Your tech stories deserve to be read — and rewarded.",
            "Join the free tech blog where your words make money.",
          ]}
        />
      </div>

      <form onSubmit={handleLogin} className="div-auth">
        <h1 style={{ color: "#fff", textAlign: "center" }}>Login</h1>

        <input
          className="input-auth"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="input-auth"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <label
          style={{
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={() => setRememberMe(!rememberMe)}
          />
          Remember Me
        </label>

        <button type="submit" className="submit-button">
          Accedi
        </button>
        <div className="signup-div">
          <h4>You don't have an account?</h4>{" "}
          <h4 className="link" onClick={() => navigate("/signup")}>
            Sign Up
          </h4>
        </div>

        {message && (
          <p style={{ color: "#fff", textAlign: "center" }}>{message}</p>
        )}
      </form>
    </div>
  );
}

export default Login;
