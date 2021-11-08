import axios from "axios";

import { ISignin, ISigninRes, ISignup, ISignupRes } from "../models/auth";
export async function signin(user: ISignin) {
  return axios.post<ISigninRes>("auth/login", user).then((d) => d.data);
}

export async function signup(user: ISignup) {
  return axios.post<ISignupRes>("auth/register", user).then((d) => d.data);
}

export async function changeProfilePicture(userId: string, image: File) {
  const formData = new FormData();
  formData.append("image", image);
  formData.append("personId", userId);
  return axios({
    method: "post",
    url: "image/addProfilePic",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
