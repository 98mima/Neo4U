import React, { useEffect, useState } from "react";
import Avatar from "@material-ui/core/Avatar";
import Button from "@material-ui/core/Button";
import CssBaseline from "@material-ui/core/CssBaseline";
import TextField from "@material-ui/core/TextField";
import Link from "@material-ui/core/Link";
import Grid from "@material-ui/core/Grid";
import Box from "@material-ui/core/Box";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import Typography from "@material-ui/core/Typography";
import { makeStyles, Theme } from "@material-ui/core/styles";
import CircularProgress from "@material-ui/core/CircularProgress";
import Container from "@material-ui/core/Container";

import { useDispatch, useSelector } from "react-redux";
import { ISignup } from "../../models/auth";
import { START_LOADING, STOP_LOADING } from "../../redux/ui/actions";
import { RootState } from "../../redux/index";
import { signupAction } from "../../redux/auth/actions";
import { useHistory } from "react-router-dom";

function Copyright() {
  return (
    <Typography variant="body2" color="textSecondary" align="center">
      {"Copyright © "}
      <Link color="inherit" href="http://localhost:3000/">
        Namgram
      </Link>{" "}
      {new Date().getFullYear()}
      {"."}
    </Typography>
  );
}

const useStyles = makeStyles((theme: Theme) => ({
  paper: {
    marginTop: "3rem",
    paddingTop: "10vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "rgb(255, 255, 255)",
    padding: "2rem",
    borderRadius: "20px",
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: "100%",
    marginTop: theme.spacing(3),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

export default function SignUp() {
  const classes = useStyles();

  const history = useHistory();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = React.useState<any>(new Date());

  const onBirthdayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBirthday(event.currentTarget.value);
  };

  const loading = useSelector((state: RootState) => state.ui.loading);
  const error = useSelector((state: RootState) => state.ui.error);
  //@ts-ignore
  const auth = useSelector((state: RootState) => state.auth.auth);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const user: ISignup = {
      name,
      lastname,
      username,
      email,
      password,
      birthday,
    };
    dispatch(signupAction(user));
  };

  const onInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (event.currentTarget.name === "email")
      setEmail(event.currentTarget.value);
    else if (event.currentTarget.name === "password")
      setPassword(event.currentTarget.value);
    else if (event.currentTarget.name === "name")
      setName(event.currentTarget.value);
    else if (event.currentTarget.name === "lastname")
      setLastname(event.currentTarget.value);
    else if (event.currentTarget.name === "username")
      setUsername(event.currentTarget.value);
  };

  useEffect(() => {
    if (auth) history.push("/");
  }, [auth]);

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <div className={classes.paper}>
        <Avatar className={classes.avatar}>
          <LockOutlinedIcon />
        </Avatar>
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        <form onSubmit={onSubmit} className={classes.form} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="fname"
                name="name"
                variant="outlined"
                required
                fullWidth
                id="firstName"
                label="First Name"
                autoFocus
                onChange={(event) => onInput(event)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="lastName"
                label="Last Name"
                name="lastname"
                autoComplete="lname"
                onChange={(event) => onInput(event)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                onChange={(event) => onInput(event)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                onChange={(event) => onInput(event)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                variant="outlined"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                onChange={(event) => onInput(event)}
              />
            </Grid>
            <Grid item xs={12}>
              <input
                type="date"
                value={birthday}
                onChange={(event) => onBirthdayChange(event)}
              ></input>
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            className={classes.submit}
          >
            {loading ? <CircularProgress color="secondary" /> : "Sign up"}
          </Button>
          <Typography color="error">{error}</Typography>
          <Grid container justify="center">
            <Grid item>
              <Link href="#" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </form>
      </div>
      <Box mt={5}>
        <Copyright />
      </Box>
    </Container>
  );
}
