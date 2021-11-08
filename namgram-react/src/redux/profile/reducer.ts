import { IProfile } from "../../models/user";
import { CLEAR_PROFILE, ProfileActionTypes, SET_PROFILE } from "./actions";

export interface ProfileState {
  profile: IProfile | undefined;
}

const initialState: ProfileState = {
  profile: undefined,
};

export default (state = initialState, action: ProfileActionTypes) => {
  switch (action.type) {
    case SET_PROFILE:
      return { ...state, profile: action.payload };
    case CLEAR_PROFILE:
      return { ...state, profile: undefined };
    default:
      return { ...state };
  }
};
