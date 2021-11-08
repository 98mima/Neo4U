import {
  CircularProgress,
  createStyles,
  makeStyles,
  Theme,
} from '@material-ui/core';
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams } from 'react-router';
import { IImage } from '../../models/post';
import { RootState } from '../../redux';
import { loadRecommendedPosts } from '../../redux/posts/actions';
import { getRec } from '../../services/chat';
import classNames from 'classnames';
import Post from '../posts/Post';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
    },
    loading: {
      margin: '20vh auto auto auto',
    },
  }),
);

function Algorithm() {
  const classes = useStyles();
  const dispatch = useDispatch();

  const posts = useSelector((state: RootState) => state.posts.posts);
  const auth = useSelector((state: RootState) => state.auth.auth);
  const socket = useSelector((state: RootState) => state.auth.socket);

  const [postovi, setRecommended] = useState<Array<IImage>>();

  const name = auth?.name;

  const { algorithm } = useParams<{ algorithm: string }>();

  const Alg = algorithm.charAt(0).toUpperCase() + algorithm.slice(1);

  useEffect(() => {
    getRec(Alg, name).then((pics: any) => {
      setRecommended(pics.Data);
    });

    // Axios.get(`http://localhost:3000/room/getJaccard/${name}`).then(
    //   (response) => {
    //     console.log('radi bre');
    //     setRecommended(response.data.Data.data);
    //     console.log(response.data);
    //   },
    // );

    if (auth) dispatch(loadRecommendedPosts(auth?.username as string));
  }, [Alg, auth, dispatch, name]);

  const loading = useSelector((state: RootState) => state.ui.loading);

  return (
    <React.Fragment>
      <div
        style={{
          color: 'white',
          fontSize: '24px',
          lineHeight: '24px',
          display: 'flex',
          justifyContent: 'center',
          maxWidth: '700px',
          alignContent: 'center',
          flexDirection: 'column',
          padding: '24px 0',
          margin: '0 auto',
          marginBottom: '24px',
        }}
      >
        {`Algorithm used for recommending chats : ${Alg}`}
        <div>
          {`This algorithm finds the most similar user to you based on the chats
          you have joined and gives you chats that your most similar user have
          liked or disliked`}
        </div>
      </div>
      <div style={{ padding: '24px' }} className={classes.container}>
        {loading && <CircularProgress size={'20vw'} className="progress" />}
        {postovi &&
          postovi.map((post, index) => (
            <Post
              key={post.id}
              style={{ marginTop: index === 0 ? '0px' : '5rem' }}
              socket={socket as SocketIOClient.Socket}
              post={post}
            />
          ))}
      </div>
    </React.Fragment>
  );
}

export default Algorithm;
