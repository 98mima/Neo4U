import { CircularProgress } from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { IImage } from '../../models/post';
import { RootState } from '../../redux';
import { START_LOADING, STOP_LOADING } from '../../redux/ui/actions';
import { getPost } from '../../services/posts';
import Post from './Post';

function SinglePost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<IImage | undefined>();
  const dispatch = useDispatch();
  const socket = useSelector((state: RootState) => state.auth.socket);

  const loading = useSelector((state: RootState) => state.ui.loading);

  useEffect(() => {
    dispatch({ type: START_LOADING });
    getPost(id).then((p) => {
      setPost(p);
      dispatch({ type: STOP_LOADING });
    });
    return () => {};
  }, [dispatch, id]);

  return (
    <div>
      {post !== undefined ? (
        <Post post={post as IImage} socket={socket as SocketIOClient.Socket} />
      ) : (
        <CircularProgress />
      )}
    </div>
  );
}

export default SinglePost;
