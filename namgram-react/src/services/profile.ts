import axios from "axios";
import { IProfile, IUser } from "../models/user";

export async function getProfile(userId: string) {
  return axios
    .get<{ message: string; Data: IUser }>(`person/byId/${userId}`)
    .then((res) => {
      const {
        id,
        birthday,
        lastname,
        name,
        username,
        profilePic,
      } = res.data.Data;
      const profile: IProfile = {
        id,
        birthday,
        lastname,
        name,
        username,
        followers: [],
        following: [],
        posts: [],
        profilePic,
      };
      return profile;
    });
}

export async function getProfileByUsername(username: string) {
  return axios
    .get<{ message: string; Data: IUser }>(`person/byUsername/${username}`)
    .then((res) => res.data.Data);
}

export async function getFollowers(username: string) {
  return axios
    .get<{ message: string; Data: IUser[] }>(`person/getFollowers/${username}`)
    .then((res) => {
      return res.data.Data;
    });
}

export async function getFollowing(username: string) {
  return axios
    .get<{ message: string; Data: IUser[] }>(`person/getFollowing/${username}`)
    .then((res) => {
      return res.data.Data;
    });
}
export async function follow(follower: string, followee: string) {
  return axios
    .post<{ username1: string; username2: string }>("person/follow", {
      username1: follower,
      username2: followee,
    })
    .then((res) => {
      return res.data;
    });
}
export async function unfollow(follower: string, followee: string) {
  return axios
    .post<{ username1: string; username2: string }>("person/unfollow", {
      username1: follower,
      username2: followee,
    })
    .then((res) => {
      return res.data;
    });
}

export async function getRecommended(username: string) {
  return axios
    .get<{ message: string; Data: IUser[] }>(
      `person/getRecommendedPeople/${username}`
    )
    .then((res) => {
      return res.data.Data;
    });
}
