import React, { useState, useRef, useEffect, useCallback } from "react";
import "./auth.css";
import PixelBlast from "./PixelBlast";
import { CheckboxItem } from "../../componenti/checkbox";
import Typewriter from "../../componenti/Typewriter.jsx";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { SupabaseClient } from "../../services/supabaseClient.js";

const RESEND_TIMER_SECONDS = 60;

function Signup() {
  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{8,}$/;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({
    errors: {},
    valid: {},
    code: null,
  });
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState(new Array(6).fill(""));
  const inputsRef = useRef([]);
  const [resendStatus, setResendStatus] = useState({
    timer: RESEND_TIMER_SECONDS,
    canResend: false,
    isResending: false,
    resendMessage: null,
  });
  const [takenData, setTakenData] = useState({
    usernames: [],
    emails: [],
  });
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
  const passwordChecks = {
    length: form.password.length >= 8,
    lowercase: /[a-z]/.test(form.password),
    uppercase: /[A-Z]/.test(form.password),
    number: /\d/.test(form.password),
    symbol: /[@$!%*?&-]/.test(form.password),
  };

  useEffect(() => {
    if (
      loading &&
      userId &&
      !resendStatus.canResend &&
      resendStatus.timer > 0
    ) {
      const interval = setInterval(() => {
        setResendStatus((prev) => ({
          ...prev,
          timer: prev.timer - 1,
        }));
      }, 1000);
      return () => clearInterval(interval);
    } else if (resendStatus.timer === 0 && !resendStatus.canResend) {
      setResendStatus((prev) => ({
        ...prev,
        canResend: true,
      }));
    }
  }, [loading, userId, resendStatus.timer, resendStatus.canResend]);

  // --- LOGICA PER L'INVIO AUTOMATICO DELL'OTP ALLA COMPILAZIONE ---
  useEffect(() => {
    const fullOtp = code.join("");
    if (fullOtp.length === 6) {
      handleVerifyOtp(fullOtp);
    }
  }, [code]);

  // --- FUNZIONE PER RICHIEDERE/RE-INVIARE L'OTP ---
  const handleResendOtp = useCallback(async () => {
    if (!resendStatus.canResend || !userId) return;

    setResendStatus((prev) => ({
      ...prev,
      isResending: true,
      canResend: false,
      resendMessage: null,
    }));
    setStatus((prev) => ({ ...prev, code: null }));

    try {
      // Chiama la Edge Function di Supabase (che gestisce: Generazione -> Salvataggio Hash -> Chiamata API Vercel)
      const response = await fetch(
        "TUO_URL_EDGE_FUNCTION/generate-otp-and-send",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            email: form.email,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore durante il re-invio.");
      }

      setResendStatus((prev) => ({
        ...prev,
        timer: RESEND_TIMER_SECONDS,
        resendMessage: "Nuovo codice inviato!",
      }));
    } catch (err) {
      setStatus((prev) => ({ ...prev, code: err.message }));
      setResendStatus((prev) => ({
        ...prev,
        canResend: true,
        resendMessage: "Errore re-invio. Riprova.",
      }));
    } finally {
      setResendStatus((prev) => ({ ...prev, isResending: false }));
    }
  }, [resendStatus.canResend, userId, form.email]);

  // --- FUNZIONE PER LA VERIFICA OTP (CHIAMA API VERCEL) ---
  const handleVerifyOtp = async (otpValue) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setStatus((prev) => ({ ...prev, code: null }));

    try {
      const response = await fetch(
        "https://techripples.vercel.app/api/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            otp_code: otpValue,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Errore dalla funzione Serverless (es. OTP scaduto, non valido, ecc.)
        throw new Error(data.error || "Verifica fallita.");
      }

      // ** VERIFICA FINALE RIUSCITA: PROCEDI CON IL LOGIN O REINDIRIZZAMENTO **
      alert("Verification successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      setStatus((prev) => ({ ...prev, code: err.message }));
      // Pulisci i campi OTP dopo un errore di verifica per sicurezza
      setCode(new Array(6).fill(""));
      inputsRef.current[0]?.focus(); // Riporta il focus all'inizio
    } finally {
      setIsProcessing(false);
    }
  };

  // --- LOGICA CAMBIAMENTO INPUT (MODIFICATA PER IL FOCUS OTP) ---
  const handleChange = (field, value, index = 0) => {
    if (field === "code") {
      const newCode = [...code];

      const val = value.slice(-1);
      newCode[index] = val;
      setCode(newCode);

      // Gestione del focus automatico in avanti
      if (val && index < code.length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
      return;
    }
    // Logica di validazione e stato per username/email/password
    setForm((prev) => ({ ...prev, [field]: value }));
    let error = "";
    let isValid = false;
    // ... (restante logica di validazione)
    switch (field) {
      case "username":
        if (!usernameRegex.test(value))
          error = "Invalid username (3-20 chars, letters/numbers only)";
        else if (takenData.usernames.includes(value))
          error = "Username already taken";
        else isValid = true;
        break;
      case "email":
        if (!emailRegex.test(value)) error = "Invalid email format";
        else if (takenData.emails.includes(value))
          error = "Email already taken";
        else isValid = true;
        break;
      case "password":
        if (!passwordRegex.test(value)) error = "Weak password";
        else {
          isValid = true;
          setShowPasswordChecklist(false);
        }
        break;

      default:
        break;
    }
    setStatus((prev) => ({
      errors: { ...prev.errors, [field]: error },
      valid: { ...prev.valid, [field]: isValid },
    }));
  };

  async function handleRegister(username, email, password) {
    const allValid =
      Object.values(status.valid).every((v) => v === true) &&
      form.username &&
      form.email &&
      form.password;
    if (!allValid) {
      alert("Please correct the errors in the form.");
      return;
    }

    setIsProcessing(true);

    const client = new SupabaseClient();

    const data = await client.create_account(username, email, password);
    const error = data?.error;
    const receivedUserId = data?.user_id;

    switch (error || data?.message) {
      case "USERNAME_TAKEN":
        setStatus((prev) => ({
          errors: {
            ...prev.errors,
            username: "Username already taken. Please choose another one.",
          },
          valid: { ...prev.valid, username: false },
        }));
        setTakenData((prev) => ({
          ...prev,
          usernames: [...prev.usernames, username],
        }));
        break;
      case "EMAIL_TAKEN":
        setStatus((prev) => ({
          errors: {
            ...prev.errors,
            email: "Email already registered. Please use another email.",
          },
          valid: { ...prev.valid, email: false },
        }));
        setTakenData((prev) => ({
          ...prev,
          emails: [...prev.emails, email],
        }));
        break;
      case "OK_SUCCESS":
        alert("registrato");
        if (receivedUserId) {
          setUserId(receivedUserId);
          setLoading(true);
          setCode(new Array(6).fill(""));
          inputsRef.current[0]?.focus();
          setResendStatus((prev) => ({
            ...prev,
            timer: RESEND_TIMER_SECONDS,
            canResend: false,
            isResending: false,
          }));
        } else {
          alert(
            "Registration succeeded, but failed to get user ID for verification."
          );
        }
        break;
      default:
        alert("An unexpected error occurred. Please try again later.");
        break;
    }
    setIsProcessing(false);
  }

  const handleCodeKeyDown = (e, i) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
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

      {/* Lo stato 'loading' è usato per commutare tra il form di registrazione e il form OTP */}
      {!loading ? (
        // --- STAGE 1: Form di Registrazione (Signup) ---
        <form
          className="div-auth"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister(form.username, form.email, form.password);
          }}
        >
          <h1 style={{ color: "#fff", textAlign: "center", marginTop: "0px" }}>
            Sign Up For Free
          </h1>
          {/* Input Username */}
          <input
            className={`input-auth ${status.valid.username ? "valid" : ""} ${
              status.errors.username ? "invalid" : ""
            }`}
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            required
          />
          {status.errors.username && (
            <p className="error-text">{status.errors.username}</p>
          )}
          {/* Input Email */}
          <input
            className={`input-auth ${status.valid.email ? "valid" : ""} ${
              status.errors.email ? "invalid" : ""
            }`}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
          {status.errors.email && (
            <p className="error-text">{status.errors.email}</p>
          )}
          {/* Input Password */}
          <input
            className={`input-auth ${status.valid.password ? "valid" : ""} ${
              status.errors.password ? "invalid" : ""
            }`}
            type="password"
            placeholder="Password"
            value={form.password}
            onFocus={() => setShowPasswordChecklist(true)}
            onBlur={() => setShowPasswordChecklist(false)}
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />
          {/* Password Checklist */}
          <div
            className="password-checklist"
            style={{
              display: showPasswordChecklist ? "flex" : "none",
              pointerEvents: "none",
            }}
          >
            {/* ... (Checkbox Items) ... */}
            <CheckboxItem
              isMet={passwordChecks.length}
              label="Atlest 8 characters"
            />
            <CheckboxItem
              isMet={passwordChecks.lowercase}
              label="At least one lowercase letter"
            />
            <CheckboxItem
              isMet={passwordChecks.uppercase}
              label="At least one uppercase letter"
            />
            <CheckboxItem
              isMet={passwordChecks.number}
              label="At least one number"
            />
            <CheckboxItem
              isMet={passwordChecks.symbol}
              label="At least one of (@$!%*?&-) "
            />
          </div>
          <button
            type="submit"
            className="submit-button"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Create Account"}
          </button>
          {/* ... (Disclaimer e Link Login) ... */}
          <div className="disclaimer-container">
            By clicking the "Create account" button, I expressly agree to the{" "}
            <span
              className="link"
              onClick={() => navigate("/terms-of-service")}
            >
              TechRipples Terms of Service{" "}
            </span>{" "}
            and understand that my account information will be used according to{" "}
            <span className="link" onClick={() => navigate("/privacy-policy")}>
              TechRipples Privacy Policy{" "}
            </span>{" "}
          </div>{" "}
          <div className="signup-div">
            <h4>You already have an account?</h4>{" "}
            <h4 className="link" onClick={() => navigate("/login")}>
              Log In{" "}
            </h4>{" "}
          </div>
        </form>
      ) : (
        // --- STAGE 2: Verifica Codice OTP ---
        <div className="div-auth">
          <h2>Verification Code</h2>
          <h3>
            Please enter the verification code sent to{" "}
            <strong style={{ color: "#fff" }}>{form.email}</strong>
          </h3>

          {/* Caselle OTP */}
          <div className={`otp-container ${status.code ? "error" : ""}`}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                className="otp-box"
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange("code", e.target.value, i)}
                onKeyDown={(e) => handleCodeKeyDown(e, i)}
                disabled={isProcessing}
              />
            ))}
          </div>

          {/* Messaggio di Errore OTP */}
          {status.code && (
            <p className="error-text" style={{ marginTop: "10px" }}>
              {status.code}
            </p>
          )}

          {/* Sezione Re-invio e Timer */}
          <div
            className="resend-section"
            style={{ marginTop: "20px", textAlign: "center" }}
          >
            <button
              onClick={handleResendOtp}
              disabled={
                !resendStatus.canResend ||
                resendStatus.isResending ||
                isProcessing
              }
              className="submit-button"
              style={{
                backgroundColor: resendStatus.canResend
                  ? "var(--primary-color)"
                  : "#555",
                cursor: resendStatus.canResend ? "pointer" : "not-allowed",
                width: "100%",
                marginBottom: "10px",
              }}
            >
              {resendStatus.isResending
                ? "Invio..."
                : resendStatus.canResend
                ? "Richiedi Nuovo Codice"
                : `Nuovo codice tra ${resendStatus.timer}s`}
            </button>

            {resendStatus.resendMessage && (
              <p style={{ color: "#00f0ff" }}>{resendStatus.resendMessage}</p>
            )}

            <p
              className="antispam-note"
              style={{ fontSize: "0.8em", color: "#aaa" }}
            >
              *Il pulsante di re-invio si riattiverà dopo {RESEND_TIMER_SECONDS}{" "}
              secondi per prevenire lo spam.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Signup;
