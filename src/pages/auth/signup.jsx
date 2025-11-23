import React, { useState, useRef, useEffect } from "react";
import "./auth.css";
import PixelBlast from "./PixelBlast";
import { CheckboxItem } from "../../componenti/checkbox";
import Typewriter from "../../componenti/Typewriter.jsx";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { SupabaseClient } from "../../services/supabaseClient.js";

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

  // --- INVIO AUTOMATICO OTP QUANDO COMPLETO ---
  useEffect(() => {
    const fullOtp = code.join("");
    if (fullOtp.length === 6) {
      handleVerifyOtp(fullOtp);
    }
  }, [code]);

  // --- VERIFICA OTP ---
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

      const text = await response.text();
      console.log("RAW RESPONSE:", text);

      let data;
      try {
        data = JSON.parse(text);
      } catch (err) {
        console.error("Invalid JSON:", text);
      }

      if (!response.ok) {
        throw new Error(data.error || "Verifica fallita.");
      }

      alert("Verification successful! You can now log in.");
      navigate("/login");
    } catch (err) {
      setStatus((prev) => ({ ...prev, code: err.message }));
      setCode(new Array(6).fill(""));
      inputsRef.current[0]?.focus();
    } finally {
      setIsProcessing(false);
    }
  };

  // --- HANDLE CHANGE ---
  const handleChange = (field, value, index = 0) => {
    if (field === "code") {
      const newCode = [...code];
      const val = value.slice(-1);
      newCode[index] = val;
      setCode(newCode);

      if (val && index < code.length - 1) {
        inputsRef.current[index + 1]?.focus();
      }
      return;
    }

    setForm((prev) => ({ ...prev, [field]: value }));

    let error = "";
    let isValid = false;

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

  // --- REGISTRAZIONE ---
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

      {!loading ? (
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

          <div
            className="password-checklist"
            style={{
              display: showPasswordChecklist ? "flex" : "none",
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

          <button
            type="submit"
            className="submit-button"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Create Account"}
          </button>

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
          </div>

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
            Please enter the verification code sent to{" "}
            <strong style={{ color: "#fff" }}>{form.email}</strong>
          </h3>

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

          {status.code && (
            <p className="error-text" style={{ marginTop: "10px" }}>
              {status.code}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Signup;
