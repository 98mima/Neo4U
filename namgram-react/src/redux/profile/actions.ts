import { IProfile, IUser } from "../../models/user";
import { getPosts } from "../../services/posts";
import { getFollowers, getFollowing, getProfile } from "../../services/profile";
import { SET_ERROR, START_LOADING, STOP_LOADING } from "../ui/actions";
import { AxiosError } from "axios";

export const SET_PROFILE = "SET_PROFILE";
export const CLEAR_PROFILE = "CLEAR_PROFILE";

export interface SetProfileAction {
  type: typeof SET_PROFILE;
  payload: IProfile;
}

export interface ClearProfileAction {
  type: typeof CLEAR_PROFILE;
}

export type ProfileActionTypes = SetProfileAction | ClearProfileAction;

export const loadProfile = (userId: string) => (dispatch: any) => {
  dispatch({ type: START_LOADING });
  getProfile(userId)
    .then((user) => {
      Promise.all([
        getFollowers(user.username),
        getFollowing(user.username),
        getPosts(userId),
      ])
        .then((res) => {
          const profile: IProfile = {
            ...user,
            followers: res[0],
            following: res[1],
            posts: res[2],
          };
          dispatch({ type: SET_PROFILE, payload: profile });
          dispatch({ type: STOP_LOADING });
        })
        .catch((err: AxiosError) => {
          console.log(err);
          dispatch({ type: STOP_LOADING });
          dispatch({ type: SET_ERROR, payload: err.response?.data });
        });
    })
    .catch((err: AxiosError) => {
      console.log(err);
      dispatch({ type: STOP_LOADING });
      dispatch({ type: SET_ERROR, payload: err.response?.data });
    });
};
