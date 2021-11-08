import { combineReducers } from "redux";

import uiReducer from "./ui/reducer";
import postsReducer from "./posts/reducer";
import authReducer from "./auth/reducer";
import profileReducer from "./profile/reducer";
import chatReducer from "./chat/reducer";

export const rootReducer = combineReducers({
  ui: uiReducer,
  posts: postsReducer,
  profile: profileReducer,
  chat: chatReducer,
  auth: authReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
