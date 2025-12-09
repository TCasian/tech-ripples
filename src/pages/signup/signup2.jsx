import { useState, useEffect, useMemo } from "react";
import "./auth.css";
import { CheckboxItem } from "../../componenti/checkbox.jsx";
import Typewriter from "../../componenti/Typewriter.jsx";
import PixelBlast from "../../componenti/PixelBlast.jsx";

import { useNavigate } from "react-router-dom";
import { SupabaseClient } from "../../services/supabaseClient.js";
import { useSignupForm } from "./useSignupForm.jsx";
import { useOtpVerification } from "./useOtpVerification.jsx";

function Signup() {
  // -- hooks ---
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);

  const {
    state: signupState,
    handleChange: signupHandleChange,
    handleRegister,
  } = useSignupForm();

  const {
    state: otpState,
    handleChange: handleCodeChange,
    handleCodeKeyDown,
    inputsRef,
    resetOtp,
  } = useOtpVerification();

  const passwordChecks = {
    length: signupState.form.password.length >= 8,
    lowercase: /[a-z]/.test(signupState.form.password),
    uppercase: /[A-Z]/.test(signupState.form.password),
    number: /\d/.test(signupState.form.password),
    symbol: /[@$!%*?&-]/.test(signupState.form.password),
  };

  const navigate = useNavigate();

  const memoTypewriter = useMemo(
    () => (
      <Typewriter
        strings={[
          "Write. Share. Earn. All about tech.",
          "Your tech stories deserve to be read — and rewarded.",
          "Join the free tech blog where your words make money.",
        ]}
      />
    ),
    []
  );

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
        {memoTypewriter}
      </div>

      {!signupState.awaitVerification ? (
        <form
          className="div-auth"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister(
              signupState.form.username,
              signupState.form.email,
              signupState.form.password
            );
          }}
        >
          <h1 style={{ color: "#fff", textAlign: "center", marginTop: "0px" }}>
            Sign Up For Free
          </h1>
          <input
            className={`input-auth ${
              signupState.errors.username === null
                ? ""
                : signupState.errors.username === ""
                ? "valid"
                : "invalid"
            }`}
            type="text"
            placeholder="Username"
            value={signupState.form.username}
            onChange={(e) => signupHandleChange("username", e.target.value)}
            required
          />
          {signupState.errors.username && (
            <p className="error-text">{signupState.errors.username}</p>
          )}

          <input
            className={`input-auth ${
              signupState.errors.email === null
                ? ""
                : signupState.errors.email === ""
                ? "valid"
                : "invalid"
            }`}
            type="email"
            placeholder="Email"
            value={signupState.form.email}
            onChange={(e) => signupHandleChange("email", e.target.value)}
            required
          />
          {signupState.errors.email && (
            <p className="error-text">{signupState.errors.email}</p>
          )}

          <input
            className={`input-auth ${
              signupState.errors.password === null
                ? ""
                : signupState.errors.password === ""
                ? "valid"
                : "invalid"
            }`}
            type="password"
            placeholder="Password"
            value={signupState.form.password}
            onFocus={() => setShowPasswordChecklist(true)}
            onBlur={() => setShowPasswordChecklist(false)}
            onChange={(e) => signupHandleChange("password", e.target.value)}
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
            disabled={signupState.loading}
          >
            {signupState.loading ? "Processing..." : "Create Account"}
          </button>

          <div className="disclaimer-container">
            By clicking "Create account", I agree to the{" "}
            <span
              className="link"
              onClick={() => navigate("/terms-of-service")}
            >
              TechRipples Terms of Service
            </span>{" "}
            and{" "}
            <span className="link" onClick={() => navigate("/privacy-policy")}>
              Privacy Policy
            </span>
            .
          </div>

          <div className="signup-div">
            <h4>You already have an account?</h4>{" "}
            <h4 className="link" onClick={() => navigate("/login")}>
              Log In
            </h4>
          </div>
        </form>
      ) : otpState.validCode ? (
        <div className="div-auth">
          <center>
            <h1 style={{ color: "green", fontWeight: "bold" }}>
              Account verified! Redirecting to login...
            </h1>
          </center>
        </div>
      ) : (
        <div className="div-auth">
          <h2>Verification Code</h2>
          <h3>
            Please enter the verification code sent to{" "}
            <strong style={{ color: "#fff" }}>{signupState.form.email}</strong>
          </h3>
          <div className={`otp-container ${otpState.error ? "error" : ""}`}>
            {otpState.code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                className={`otp-box ${
                  otpState.error === null
                    ? ""
                    : otpState.error === ""
                    ? "valid"
                    : "invalid"
                }`}
                type="text"
                inputMode="numeric"
                pattern="[0-9]"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(e.target.value, i, inputsRef)}
                onKeyDown={(e) => handleCodeKeyDown(e, i, inputsRef)}
                disabled={otpState.isProcessing}
              />
            ))}
          </div>
          <h3>
            This code will expire in 5 minutes. You can request a new one after
            it expires.
          </h3>
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
