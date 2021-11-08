import React, { useEffect, useState } from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';

import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import Create from '@material-ui/icons/Create';

import 'reactjs-popup/dist/index.css';

import { useSelector, useDispatch } from 'react-redux';
import { loadProfile } from '../../redux/profile/actions';
import { RootState } from '../../redux';
import { follow, unfollow } from '../../services/profile';
import {
  Backdrop,
  Fade,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Modal,
} from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  container: {
    marginTop: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  paper: {
    margin: theme.spacing(3),
    marginBottom: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'space-around',
    padding: '0 5px',

    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
  },
  avatar: {
    width: '200px',
    height: '200px',
  },
  loading: {
    width: '500px',
    height: '500px',
    margin: '0 auto',
  },
  userName: {
    display: 'flex',
    flexDirection: 'row',
  },
  count: {
    textAlign: 'center',
    '&:hover': {
      backgroundColor: 'rgb(0, 0, 0, 0.1)',
      cursor: 'pointer',
      borderRadius: '5%',
    },
  },
  gridList: {
    paddingTop: '20px',
    width: '100%',
    height: '50vh',
  },
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  button: {
    textDecoration: 'none',
  },
  imageClickable: {
    '&:hover': {
      backgroundColor: 'rgb(0, 0, 0, 0.1)',
      cursor: 'pointer',
      borderRadius: '5%',
    },
  },
}));

function Profile() {
  const { id } = useParams<{ id: string }>();
  const history = useHistory();
  const classes = useStyles();
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.profile.profile);
  const error = useSelector((state: RootState) => state.ui.error);
  const loading = useSelector((state: RootState) => state.ui.loading);
  const auth = useSelector((state: RootState) => state.auth.auth);
  const [isFollowing, setIsFollowing] = useState(false);

  const [openFollowers, setOpenFollowers] = React.useState(false);
  const [openFollowing, setOpenFollowing] = React.useState(false);

  useEffect(() => {
    if (!profile) {
      dispatch(loadProfile(id));
    } else if (profile.id !== id) {
      dispatch(loadProfile(id));
    }
    if (
      profile &&
      auth?.following.some((user) => user.username === profile?.username)
    ) {
      setIsFollowing(true);
    } else {
      setIsFollowing(false);
    }
    return () => {};
  }, [auth, profile, id]);

  const following = (username: string) => {
    if (
      profile &&
      username &&
      auth?.following.some((user) => user.username === username)
    )
      return true;
    else return false;
  };
  const handleEdit = () => {
    console.log(profile?.following);
    //history.push("/profile/edit/" + auth?.id);
  };
  const handleFollow = () => {
    const username1 = auth?.username;
    const username2 = profile?.username;
    follow(username1 as string, username2 as string);
    setIsFollowing(true);
  };
  const handleUnFollow = () => {
    const username1 = auth?.username;
    const username2 = profile?.username;
    unfollow(username1 as string, username2 as string);
    setIsFollowing(false);
  };
  const visit = (id: string) => {
    history.push(`/profile/${id}`);
  };
  const handleUnFollowFromList = (username: string) => {
    const username1 = auth?.username;
    const username2 = username;
    unfollow(username1 as string, username2 as string);
  };
  const openInNewTab = (url: string) => {
    const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
    if (newWindow) newWindow.opener = null;
  };

  const checkMyProfile = () => {
    if (!auth) return false;
    else {
      return profile?.id === auth?.id;
    }
  };
  const handleOpenFollowers = () => {
    setOpenFollowers(true);
  };

  const handleCloseFollowers = () => {
    setOpenFollowers(false);
  };

  const handleOpenFollowing = () => {
    setOpenFollowing(true);
  };

  const handleCloseFollowing = () => {
    setOpenFollowing(false);
  };
  const handleGoToPost = (postId: string) => {
    history.push(`/post/${postId}`);
  };

  return (
    <Container component="main" maxWidth="xs">
      {error && <Typography>{error}</Typography>}
      {loading && <CircularProgress className={classes.loading} />}
      {profile && (
        <Paper variant="outlined" className={classes.paper}>
          <div className={classes.container}>
            <Avatar
              className={classes.avatar}
              src={profile?.profilePic}
            ></Avatar>

            <br />
            <Typography variant="h4">{profile.username}</Typography>
            <Grid container>
              <Grid className={classes.count} item xs={4}>
                <Typography>{profile?.posts.length}</Typography>
                <Typography>Posts</Typography>
              </Grid>
              <Grid className={classes.count} item xs={4}>
                <div>
                  <div onClick={handleOpenFollowers}>
                    <Typography>{profile?.followers.length}</Typography>
                    <Typography>Followers</Typography>
                  </div>
                  <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    className={classes.modal}
                    open={openFollowers}
                    onClose={handleCloseFollowers}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                      timeout: 500,
                    }}
                  >
                    <Fade in={openFollowers}>
                      <List className={classes.root}>
                        {profile.followers.map((person) => (
                          <ListItem key={person.id}>
                            <ListItemAvatar>
                              <Avatar src={person.profilePic}></Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={person.username}
                              secondary={person.name + ' ' + person.lastname}
                            />

                            <Link
                              className={classes.button}
                              to={`/profile/${person.id}`}
                            >
                              <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                onClick={() => visit(person.id)}
                              >
                                Visit
                              </Button>
                            </Link>
                          </ListItem>
                        ))}
                      </List>
                    </Fade>
                  </Modal>
                </div>
              </Grid>
              <Grid className={classes.count} item xs={4}>
                <div>
                  <div onClick={handleOpenFollowing}>
                    <Typography>{profile?.following.length}</Typography>
                    <Typography>Following</Typography>
                  </div>
                  <Modal
                    aria-labelledby="transition-modal-title"
                    aria-describedby="transition-modal-description"
                    className={classes.modal}
                    open={openFollowing}
                    onClose={handleCloseFollowing}
                    closeAfterTransition
                    BackdropComponent={Backdrop}
                    BackdropProps={{
                      timeout: 500,
                    }}
                  >
                    <Fade in={openFollowing}>
                      <List className={classes.root}>
                        {profile.following.map((person) => (
                          <ListItem key={person.id}>
                            <ListItemAvatar>
                              <Avatar src={person.profilePic}></Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={person.username}
                              secondary={person.name + ' ' + person.lastname}
                            />

                            <Link
                              className={classes.button}
                              to={`/profile/${person.id}`}
                            >
                              <Button
                                type="submit"
                                variant="contained"
                                color="secondary"
                                onClick={() => visit(person.id)}
                              >
                                Visit
                              </Button>
                            </Link>
                          </ListItem>
                        ))}
                      </List>
                    </Fade>
                  </Modal>
                </div>
              </Grid>
            </Grid>
            {checkMyProfile() && (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={() => {
                  history.push('/editProfile');
                }}
              >
                <Create />
                Change profile
              </Button>
            )}
            {!checkMyProfile() && !isFollowing && (
              <Button
                type="submit"
                variant="contained"
                color="primary"
                onClick={handleFollow}
              >
                Follow
              </Button>
            )}
            {!checkMyProfile() && isFollowing && (
              <Button
                type="submit"
                variant="contained"
                color="secondary"
                onClick={handleUnFollow}
              >
                Unfollow
              </Button>
            )}
          </div>
          <GridList cellHeight={160} className={classes.gridList} cols={3}>
            {profile.posts.map((post, i) => (
              <GridListTile key={i} cols={1}>
                <img
                  className={classes.imageClickable}
                  onClick={() => handleGoToPost(post.id)}
                  src={post.sasToken}
                  alt={'Slicka bato'}
                />
              </GridListTile>
            ))}
          </GridList>
        </Paper>
      )}
    </Container>
  );
}

export default Profile;
