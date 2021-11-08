import axios from "axios";
import { IUser } from "../models/user";

export async function getUserById(id: string) {
  return axios
    .get<{ message: string; Data: IUser }>(`person/byId/${id}`)
    .then((d) => d.data);
}

export async function deleteUser(username: string) {
  return axios
    .delete<{ username: string }>("person/delete/" + username)
    .then((res) => {
      return res.data;
    });
}
