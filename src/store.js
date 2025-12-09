import { configureStore } from "@reduxjs/toolkit";
import menuReducer from "./features/menu/menuSlice.js";
import userReducer from "./features/user/userSlice.js";

export const store = configureStore({
  reducer: {
    menu: menuReducer,
    user: userReducer,
  },
});
