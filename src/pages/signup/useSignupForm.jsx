import { useReducer } from "react";
import { SupabaseClient } from "../../services/supabaseClient";
import { set_userId } from "../../features/user/userSlice";
import { useDispatch } from "react-redux";

const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&-])[A-Za-z\d@$!%*?&-]{8,}$/;

const signupState = {
  form: { username: "", email: "", password: "" },
  errors: { username: null, email: null, password: null },
  awaitVerification: false,
  loading: false,
  userId: null,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
      };
    case "SET_ERROR":
      return {
        ...state,
        errors: { ...state.errors, [action.field]: action.message },
      };
    case "SET_LOADING":
      return {
        ...state,
        loading: action.value,
      };
    case "SET_AWAIT_VERIFICATION":
      return {
        ...state,
        awaitVerification: action.value,
      };
    default:
      return state;
  }
}

export function useSignupForm() {
  const [state, dispatch] = useReducer(reducer, signupState);
  const reduxDispatch = useDispatch();

  const handleChange = (field, value) => {
    dispatch({ type: "SET_FIELD", field, value });

    let error = "";
    switch (field) {
      case "username":
        if (!usernameRegex.test(value)) {
          error = "Invalid username (3-20 chars).";
        }
        break;
      case "email":
        if (!emailRegex.test(value)) {
          error = "Invalid email format.";
        }
        break;
      case "password":
        if (!passwordRegex.test(value)) {
          error =
            "Password must be at least 8 chars, include upper/lowercase, number, and symbol.";
        }
        break;
      default:
        break;
    }
    dispatch({ type: "SET_ERROR", field, message: error });
  };

  const handleRegister = async (username, email, password) => {
    dispatch({ type: "SET_LOADING", value: true });
    const client = new SupabaseClient();
    const data = await client.create_account(username, email, password);
    console.log("Signup response:", data);
    const error = data?.error;
    if (error === "USERNAME_TAKEN") {
      dispatch({
        type: "SET_ERROR",
        field: "username",
        message: "Username already taken.",
      });
    } else if (error === "EMAIL_TAKEN") {
      dispatch({
        type: "SET_ERROR",
        field: "email",
        message: "Email already registered.",
      });
    } else if (data?.message === "OK_SUCCESS") {
      alert("Registration successful! Please verify your email.");
      dispatch({ type: "SET_LOADING", value: false });
      dispatch({ type: "SET_AWAIT_VERIFICATION", value: true });
      const receivedUserId = data?.user_id;
      reduxDispatch(set_userId(receivedUserId));
    }
  };

  return { state, handleChange, handleRegister };
}
