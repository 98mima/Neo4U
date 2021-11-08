import { IUser } from "./user";

export interface IPost {
  user: {
    id: string;
    username: string;
    image: string;
  };
  id: string;
  image: string;
  likes: number;
  dislikes: number;
}
export interface IComment {
  commId: string;
  content: string;
  date: Date;
  creator: IUser;
}

export interface IImage {
  id: string;
  date: Date;
  content: string;
  sasToken: string;
  likes: number;
  dislikes: number;
  comments: number;
  ifLiked: boolean;
  ifDisliked: boolean;
  creator: IUser;
}

export interface IPostUpload {
  image: File;
  personId: string;
  caption: string;
}

export interface INotification {
  liker: string;
  post: string;
}
