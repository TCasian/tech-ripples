import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user_id: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    set_userId: (state, action) => {
      state.user_id = action.payload;
    },
  },
});

export const { set_userId } = userSlice.actions;
export default userSlice.reducer;
