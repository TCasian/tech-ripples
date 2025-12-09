import { useReducer, useRef } from "react";
import { useSelector } from "react-redux";

const otpState = {
  code: new Array(6).fill(""),
  triesLeft: 4,
  resendTimer: 60,
  error: null,
  validCode: false,
  isProcessing: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_DIGIT":
      const newCode = [...state.code];
      newCode[action.index] = action.value;
      return { ...state, code: newCode };
    case "SET_PROCESSING":
      return { ...state, isProcessing: action.value };
    case "SET_ERROR":
      return { ...state, error: action.error };
    case "RESET":
      return { ...state, code: new Array(6).fill(""), error: null };
    case "DECREMENT_TRIES":
      return { ...state, triesLeft: state.triesLeft - 1 };
    case "SET_VALID_CODE":
      return { ...state, validCode: action.value };
    default:
      return state;
  }
}

export function useOtpVerification() {
  const [state, dispatch] = useReducer(reducer, otpState);
  const inputsRef = useRef([]);
  const userId = useSelector((state) => state.user.user_id);

  const handleVerifyOtp = async (otpValue) => {
    if (state.isProcessing) return;

    dispatch({ type: "SET_PROCESSING", value: true });
    dispatch({ type: "RESET" });

    try {
      const res = await fetch("https://techripples.vercel.app/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, otp_code: otpValue }),
      });
      const text = await res.text();
      const data = JSON.parse(text);
      if (!res.ok) throw new Error(data.error || "Verification failed");
      dispatch({ type: "SET_VALID_CODE", value: true });
      alert("OTP verified successfully!");
    } catch (err) {
      dispatch({ type: "SET_ERROR", error: err.message });
      dispatch({ type: "DECREMENT_TRIES" });
      dispatch({ type: "RESET" });
      inputsRef.current[0]?.focus();
    } finally {
      dispatch({ type: "SET_PROCESSING", value: false });
    }
  };

  const handleChange = (value, index) => {
    const char = value.replace(/[^0-9]/g, "").slice(0, 1);

    dispatch({ type: "SET_DIGIT", index, value: char });

    if (char && index < state.code.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
    const newCode = [...state.code];
    newCode[index] = char;
    if (newCode.every((c) => c !== "")) {
      handleVerifyOtp(newCode.join(""));
    }
  };

  const handleCodeKeyDown = (e, index) => {
    if (e.key !== "Backspace") return;
    e.preventDefault();
    if (state.code[index]) {
      dispatch({ type: "SET_DIGIT", index, value: "" });
      return;
    }
    if (index > 0) {
      const prevIndex = index - 1;
      dispatch({ type: "SET_DIGIT", index: prevIndex, value: "" });
      inputsRef.current[prevIndex]?.focus();
    }
  };

  const resetOtp = () => dispatch({ type: "RESET" });

  return { state, handleChange, handleCodeKeyDown, inputsRef, resetOtp };
}
