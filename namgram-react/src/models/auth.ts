import { IUser } from "./user";

export interface ISignin {
  email: string;
  password: string;
}

export interface ISigninRes {
  AuthToken: string;
  Success: boolean;
}

export interface ISignup {
  name: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  birthday: Date;
}

export interface ISignupRes {
  AuthToken: string;
  Success: boolean;
}

export interface IAuth {
  id: string;
  name: string;
  lastname: string;
  username: string;
  email: string;
  profilePic: string;
  followers: IUser[];
  following: IUser[];
}
