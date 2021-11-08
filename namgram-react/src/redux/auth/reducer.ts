import { IAuth } from "../../models/auth";
import { INotification } from "../../models/post";
import {
  AuthActionTypes,
  CLEAR_AUTH,
  CLEAR_NOTIFICATIONS,
  ADD_NOTIFICATION,
  SET_AUTH,
  SET_SOCKET,
} from "./actions";

export interface AuthState {
  auth: IAuth | null;
  socket: SocketIOClient.Socket | null;
  notifications: INotification[];
}

const initialState: AuthState = {
  auth: null,
  socket: null,
  notifications: [],
};

export default (state = initialState, action: AuthActionTypes) => {
  switch (action.type) {
    case SET_AUTH:
      return { ...state, auth: action.payload };
    case CLEAR_AUTH:
      return { ...state, auth: null };
    case SET_SOCKET:
      return { ...state, socket: action.payload };
    case ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
      };
    case CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };
    default:
      return { ...state };
  }
};
