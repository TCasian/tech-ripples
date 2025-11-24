import React, { useState, useRef, useEffect } from "react";
import "./auth.css";
import PixelBlast from "./PixelBlast";
import { CheckboxItem } from "../../componenti/checkbox";
import Typewriter from "../../componenti/Typewriter.jsx";
import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "../../services/supabaseClient.js";

function Signup() {
  const navigate = useNavigate();
  const inputsRef = useRef([]);

  const [state, setState] = useState({
    form: { username: "", email: "", password: "" },
    status: { errors: {}, valid: {}, code: null },
    loading: false,
    isProcessing: false,
    userId: null,
    code: new Array(6).fill(""),
    takenData: { usernames: [], emails: [] },
    showPasswordChecklist: false,
  });

  const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{8,}$/;

  const passwordChecks = {
    length: state.form.password.length >= 8,
    lowercase: /[a-z]/.test(state.form.password),
    uppercase: /[A-Z]/.test(state.form.password),
    number: /\d/.test(state.form.password),
    symbol: /[@$!%*?&-]/.test(state.form.password),
  };

  // --- INVIO AUTOMATICO OTP QUANDO COMPLETO ---
  useEffect(() => {
    const fullOtp = state.code.join("");
    if (fullOtp.length === 6) handleVerifyOtp(fullOtp);
  }, [state.code]);

  // --- VALIDAZIONE CAMPPO ---
  const validateField = (field, value) => {
    let error = "";
    let isValid = false;

    switch (field) {
      case "username":
        if (!usernameRegex.test(value)) error = "Invalid username";
        else if (state.takenData.usernames.includes(value))
          error = "Username already taken";
        else isValid = true;
        break;

      case "email":
        if (!emailRegex.test(value)) error = "Invalid email format";
        else if (state.takenData.emails.includes(value))
          error = "Email already taken";
        else isValid = true;
        break;

      case "password":
        if (!passwordRegex.test(value)) error = "Weak password";
        else {
          isValid = true;
          setState((prev) => ({ ...prev, showPasswordChecklist: false }));
        }
        break;

      default:
        break;
    }

    return { error, isValid };
  };

  // --- CAMBIO INPUT ---
  const handleChange = (field, value, index = 0) => {
    if (field === "code") {
      const newCode = [...state.code];
      newCode[index] = value.slice(-1);
      setState((prev) => ({ ...prev, code: newCode }));
      if (value && index < newCode.length - 1)
        inputsRef.current[index + 1]?.focus();
      return;
    }

    const { error, isValid } = validateField(field, value);
    setState((prev) => ({
      ...prev,
      form: { ...prev.form, [field]: value },
      status: {
        ...prev.status,
        errors: { ...prev.status.errors, [field]: error },
        valid: { ...prev.status.valid, [field]: isValid },
      },
    }));
  };

  // --- REGISTRAZIONE ---
  const handleRegister = async () => {
    const allValid =
      Object.values(state.status.valid).every((v) => v) &&
      state.form.username &&
      state.form.email &&
      state.form.password;

    if (!allValid) return alert("Please correct the errors in the form.");

    setState((prev) => ({ ...prev, isProcessing: true }));

    const client = new SupabaseClient();
    const data = await client.create_account(
      state.form.username,
      state.form.email,
      state.form.password
    );

    const receivedUserId = data?.user_id;

    switch (data?.error || data?.message) {
      case "USERNAME_TAKEN":
        setState((prev) => ({
          ...prev,
          status: {
            ...prev.status,
            errors: {
              ...prev.status.errors,
              username: "Username already taken",
            },
            valid: { ...prev.status.valid, username: false },
          },
          takenData: {
            ...prev.takenData,
            usernames: [...prev.takenData.usernames, state.form.username],
          },
        }));
        break;

      case "EMAIL_TAKEN":
        setState((prev) => ({
          ...prev,
          status: {
            ...prev.status,
            errors: {
              ...prev.status.errors,
              email: "Email already registered",
            },
            valid: { ...prev.status.valid, email: false },
          },
          takenData: {
            ...prev.takenData,
            emails: [...prev.takenData.emails, state.form.email],
          },
        }));
        break;

      case "OK_SUCCESS":
        alert("Registrato!");
        if (receivedUserId)
          setState((prev) => ({
            ...prev,
            userId: receivedUserId,
            loading: true,
            code: new Array(6).fill(""),
          }));
        break;

      default:
        alert("Unexpected error");
        break;
    }

    setState((prev) => ({ ...prev, isProcessing: false }));
  };

  // --- VERIFICA OTP ---
  const handleVerifyOtp = async (otpValue) => {
    if (state.isProcessing) return;
    setState((prev) => ({
      ...prev,
      isProcessing: true,
      status: { ...prev.status, code: null },
    }));

    try {
      const response = await fetch(
        "https://techripples.vercel.app/api/verify-otp",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: state.userId, otp_code: otpValue }),
        }
      );

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (!response.ok) throw new Error(data?.error || "Verifica fallita.");

      alert("Verification successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: { ...prev.status, code: err.message },
        code: new Array(6).fill(""),
      }));
      inputsRef.current[0]?.focus();
    } finally {
      setState((prev) => ({ ...prev, isProcessing: false }));
    }
  };

  // --- BACKSPACE OTP ---
  const handleCodeKeyDown = (e, i) => {
    if (e.key === "Backspace" && !state.code[i] && i > 0)
      inputsRef.current[i - 1]?.focus();
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

      {!state.loading ? (
        <form
          className="div-auth"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          <h1 style={{ color: "#fff", textAlign: "center", marginTop: "0px" }}>
            Sign Up For Free
          </h1>

          {/* USERNAME */}
          <input
            className={`input-auth ${
              state.status.valid.username ? "valid" : ""
            } ${state.status.errors.username ? "invalid" : ""}`}
            type="text"
            placeholder="Username"
            value={state.form.username}
            onChange={(e) => handleChange("username", e.target.value)}
            required
          />
          {state.status.errors.username && (
            <p className="error-text">{state.status.errors.username}</p>
          )}

          {/* EMAIL */}
          <input
            className={`input-auth ${state.status.valid.email ? "valid" : ""} ${
              state.status.errors.email ? "invalid" : ""
            }`}
            type="email"
            placeholder="Email"
            value={state.form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            required
          />
          {state.status.errors.email && (
            <p className="error-text">{state.status.errors.email}</p>
          )}

          {/* PASSWORD */}
          <input
            className={`input-auth ${
              state.status.valid.password ? "valid" : ""
            } ${state.status.errors.password ? "invalid" : ""}`}
            type="password"
            placeholder="Password"
            value={state.form.password}
            onFocus={() =>
              setState((prev) => ({ ...prev, showPasswordChecklist: true }))
            }
            onBlur={() =>
              setState((prev) => ({ ...prev, showPasswordChecklist: false }))
            }
            onChange={(e) => handleChange("password", e.target.value)}
            required
          />

          {/* PASSWORD CHECKLIST */}
          <div
            className="password-checklist"
            style={{
              display: state.showPasswordChecklist ? "flex" : "none",
              pointerEvents: "none",
            }}
          >
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
              label="At least one of (@$!%*?&-)"
            />
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="submit-button"
            disabled={state.isProcessing}
          >
            {state.isProcessing ? "Processing..." : "Create Account"}
          </button>

          {/* DISCLAIMER */}
          <div className="disclaimer-container">
            By clicking "Create account", I agree to{" "}
            <span
              className="link"
              onClick={() => navigate("/terms-of-service")}
            >
              Terms of Service
            </span>{" "}
            and{" "}
            <span className="link" onClick={() => navigate("/privacy-policy")}>
              Privacy Policy
            </span>
            .
          </div>

          {/* LOGIN LINK */}
          <div className="signup-div">
            <h4>You already have an account?</h4>{" "}
            <h4 className="link" onClick={() => navigate("/login")}>
              Log In
            </h4>
          </div>
        </form>
      ) : (
        <div className="div-auth">
          <h2>Verification Code</h2>
          <h3>
            Enter the code sent to <strong>{state.form.email}</strong>
          </h3>

          {/* OTP INPUTS */}
          <div className={`otp-container ${state.status.code ? "error" : ""}`}>
            {state.code.map((digit, i) => (
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
                disabled={state.isProcessing}
              />
            ))}
          </div>

          {state.status.code && (
            <p className="error-text" style={{ marginTop: "10px" }}>
              {state.status.code}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Signup;
