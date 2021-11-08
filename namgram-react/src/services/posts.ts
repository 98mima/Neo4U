import axios from "axios";
import { IComment, IImage, IPostUpload } from "../models/post";

export async function getPost(id: string) {
  return axios
    .get<{ message: string; Data1: IImage[] }>(`image/${id}`)
    .then((res) => {
      console.log(res.data)
      return res.data.Data1[0];
    });
}

export async function getPosts(userId: string) {
  return axios
    .get<{ message: string; Data1: IImage[] }>(`image/byId/${userId}`)
    .then((res) => {
      return res.data.Data1;
    });
}

export async function likePost(userId: string, imageId: string, postRate: number) {
  return axios
    .post<{ imageId: string; personId: string, score: number }>(`image/like`, {
      imageId,
      personId: userId,
      score: postRate
    })
    .then((res) => {
      return res.data;
    });
}
export async function removeLike(userId: string, imageId: string) {
  return axios
    .post<{ imageId: string; personId: string }>(`image/removeLike`, {
      imageId,
      personId: userId,
    })
    .then((res) => {
      return res.data;
    });
}

export async function dislikePost(userId: string, imageId: string, postRate: number) {
  return axios
    .post<{ imageId: string; personId: string }>(`image/dislike`, {
      imageId,
      personId: userId,
      score: postRate
    })
    .then((res) => {
      return res.data;
    });
}
export async function removedisLike(userId: string, imageId: string) {
  return axios
    .post<{ imageId: string; personId: string }>(`image/removedisLike`, {
      imageId,
      personId: userId,
    })
    .then((res) => {
      return res.data;
    });
}

export async function getFollowerPosts(userId: string) {
  return axios
    .get<{ message: string; Data: IImage[] }>(`image/byFollowings/${userId}`)
    .then((res) => res.data.Data);
}

export async function uploadPost(uploadForm: IPostUpload) {
  const formData = new FormData();
  formData.append("image", uploadForm.image);
  formData.append("personId", uploadForm.personId);
  formData.append("caption", uploadForm.caption);
  return axios({
    method: "post",
    url: "image/add",
    data: formData,
    headers: { "Content-Type": "multipart/form-data" },
  });
}
export async function getComments(imageId: string) {
  return axios
    .get<{ message: string; p: IComment[] }>(`comment/byImageId/${imageId}`)
    .then((res) => res.data.p);
}
export async function addComment(
  imageId: string,
  personId: string,
  content: string
) {
  return axios
    .post<{ message: string; Data: IComment }>(`comment/addToImage`, {
      imageId: imageId,
      personId: personId,
      content: content,
    })
    .then((res) => {
      return res.data.Data;
    });
}
export async function deletePost(imageId: string) {
  return axios
    .delete<{ imageId: string }>("image/deleteImage/" + imageId)
    .then((res) => {
      return res.data;
    });
}

export async function getPopularPosts(username: string) {
  return axios
    .get<{ message: string; Data1: IImage[] }>(`image/mostLikedF/${username}`)
    .then((res) => {
      return res.data.Data1;
    });
}

export async function getRecommendedPosts(username: string){
  return axios
    .get<{message: string; Data: IImage[]}>(`person/getRecommendedImages/${username}`)
    .then((res) => {
      return res.data.Data;
    })
}

export async function getHatedPosts(username: string) {
  return axios
    .get<{ message: string; Data1: IImage[] }>(`image/mostHatedF/${username}`)
    .then((res) => {
      return res.data.Data1;
    });
}


export async function getCommentedPosts(username: string) {
  return axios
    .get<{ message: string; Data1: IImage[] }>(`image/mostCommentedF/${username}`)
    .then((res) => {
      return res.data.Data1;
    });
}
export async function deleteComment(id: string) {
  return axios
    .delete<{ id: string }>("comment/deleteFromImage/" + id)
    .then((res) => {
      return res.data;
    });
}


