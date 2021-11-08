import {
  IAuth,
  ISignin,
  ISigninRes,
  ISignup,
  ISignupRes,
} from "../../models/auth";
import { signin, signup } from "../../services/auth";
import {
  SET_ERROR,
  CLEAR_ERROR,
  START_LOADING,
  STOP_LOADING,
} from "../ui/actions";

import jwtDecode from "jwt-decode";
import axios, { AxiosError } from "axios";
import io from "socket.io-client";
import { getUserById } from "../../services/user";
import { getFollowers, getFollowing } from "../../services/profile";
import { INotification } from "../../models/post";
import { messageReceived, NEW_MESSAGE } from "../chat/actions";

export const SET_AUTH = "SET_AUTH";
export const CLEAR_AUTH = "CLEAR_AUTH";
export const SET_SOCKET = "SET_SOCKET";

export const ADD_NOTIFICATION = "ADD_NOTIFICATION";
export const CLEAR_NOTIFICATIONS = "CLEAR_NOTIFICATIONS";

export interface SetAuthAction {
  type: typeof SET_AUTH;
  payload: IAuth;
}

export interface ClearAuthAction {
  type: typeof CLEAR_AUTH;
}

export interface SetSocketAction {
  type: typeof SET_SOCKET;
  payload: SocketIOClient.Socket;
}

export interface AddNotificationsAction {
  type: typeof ADD_NOTIFICATION;
  payload: INotification;
}

export interface ClearNotificationsAction {
  type: typeof CLEAR_NOTIFICATIONS;
}

export type AuthActionTypes =
  | SetAuthAction
  | ClearAuthAction
  | SetSocketAction
  | AddNotificationsAction
  | ClearNotificationsAction;

export const authUser = () => (dispatch: any) => {
  const token = localStorage.TOKEN;
  if (token) {
    const decodedToken: { id: string; username: string } = jwtDecode(token);
    Promise.all([
      getUserById(decodedToken.id),
      getFollowers(decodedToken.username),
      getFollowing(decodedToken.username),
    ])
      .then((res) => {
        const user = res[0].Data;
        const followers = res[1];
        const following = res[2];

        const socket = io("ws://localhost:8000", {
          query: `userId=${user.id}`,
        });
        //Da se poradi
        socket.on("liked", (message: { post: string; liker: string }) => {
          dispatch({
            type: ADD_NOTIFICATION,
            payload: { post: message.post, liker: message.liker },
          });
        });
        socket.on(
          "newMessage",
          (message: { from: string; to: string; body: string }) => {
            dispatch(messageReceived(message.from, message.to, message.body));
          }
        );
        dispatch({ type: SET_SOCKET, payload: socket });

        dispatch({
          type: SET_AUTH,
          payload: { ...user, followers, following },
        });
        axios.defaults.headers.common["Authorization"] = token;
      })
      .catch((err) => console.log("Bad token"));
  }
};

export const signinAction = (user: ISignin) => (dispatch: any) => {
  dispatch({ type: START_LOADING });
  dispatch({ type: CLEAR_ERROR });
  signin(user)
    .then((res: ISigninRes) => {
      dispatch({ type: CLEAR_ERROR });
      const token = `Bearer ${(res as ISigninRes).AuthToken}`;
      window.localStorage.setItem("TOKEN", token);
      axios.defaults.headers.common["Authorization"] = token;
      const decodedToken: IAuth = jwtDecode(token);

      dispatch(authUser());

      //dispatch({type: SET_AUTH, payload: decodedToken})
      dispatch({ type: STOP_LOADING });
    })
    .catch((err: AxiosError) => {
      dispatch({ type: STOP_LOADING });
      if (err.request) {
        dispatch({ type: SET_ERROR, payload: `${err.request.response}` });
      } else if (err.response) {
        dispatch({ type: SET_ERROR, payload: `${err.response.data}` });
      } else {
        console.log(err);
      }
    });
};

export const signupAction = (user: ISignup) => (dispatch: any) => {
  dispatch({ type: START_LOADING });
  dispatch({ type: CLEAR_ERROR });
  signup(user)
    .then((res: ISignupRes) => {
      dispatch({ type: CLEAR_ERROR });
      const token = `Bearer ${(res as ISigninRes).AuthToken}`;
      window.localStorage.setItem("TOKEN", token);
      axios.defaults.headers.common["Authorization"] = token;
      const decodedToken: IAuth = jwtDecode(token);
      dispatch(authUser());
      // dispatch({type: SET_AUTH, payload: decodedToken})
      dispatch({ type: STOP_LOADING });
    })
    .catch((err: AxiosError) => {
      dispatch({ type: STOP_LOADING });
      if (err.request) {
        dispatch({ type: SET_ERROR, payload: `${err.request.response}` });
      } else if (err.response) {
        dispatch({ type: SET_ERROR, payload: `${err.response.data}` });
      } else {
        console.log(err);
      }
    });
};

export const logoutAction = () => (dispatch: any) => {
  localStorage.removeItem("TOKEN");
  delete axios.defaults.headers.common["Authorization"];
  dispatch({ type: CLEAR_AUTH });
  window.location.href = "/";
};
