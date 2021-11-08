import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";

//MUI
import { makeStyles } from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import Paper from "@material-ui/core/Paper";
import { RootState } from "../../redux";
import { useDispatch, useSelector } from "react-redux";
import { TextField, Typography, CircularProgress } from "@material-ui/core";
import { SET_ERROR, START_LOADING, STOP_LOADING } from "../../redux/ui/actions";
import { uploadPost } from "../../services/posts";

const useStyles = makeStyles((theme) => ({
  paper: {
    maxWidth: "600px",
    padding: "20px",
    margin: "10vw auto 0 auto",
    height: "50vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
  },
  form: {},
  input: {
    flex: 1,
    width: "80%",
  },
  image: {
    maxWidth: "600px",
  },
  btn: {
    marginTop: "3rem",
    width: "80%",
  },
}));

function CreatePost() {
  const classes = useStyles();
  const history = useHistory();
  const dispatch = useDispatch();

  const [caption, setCaption] = useState("");
  const [file, setFile] = useState<File>();
  const auth = useSelector((state: RootState) => state.auth.auth);
  const loading = useSelector((state: RootState) => state.ui.loading);
  const error = useSelector((state: RootState) => state.ui.error);

  useEffect(() => {
    return () => {};
  }, []);

  const onInput = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    event.preventDefault();
    setCaption(event.currentTarget.value);
  };

  const onFileChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLInputElement>
  ) => {
    if (!event.currentTarget.files?.length) return;
    const name = event.currentTarget.files[0].name;
    if (
      name.includes(".jpg") ||
      name.includes(".png") ||
      name.includes(".JPG") ||
      name.includes(".PNG")
    ) {
      setFile(event.currentTarget.files[0]);
    } else {
      dispatch({
        type: SET_ERROR,
        payload: "Tip fajla nije podržan (podržani .jpg i .png)",
      });
    }
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (caption && file) {
      dispatch({ type: START_LOADING });
      const id = auth?.id as string;
      uploadPost({ caption, image: file, personId: id })
        .then((res) => {
          dispatch({ type: STOP_LOADING });
          dispatch({ type: SET_ERROR, payload: "" });
          history.push("/");
          //Da bude redirect do slike
        })
        .catch((err) => {
          dispatch({ type: STOP_LOADING });
          dispatch({ type: SET_ERROR, payload: "Sva polja su obavezna!" });
        });
    } else {
      dispatch({ type: SET_ERROR, payload: "Sva polja su obavezna!" });
    }
  };

  return (
    <form className={classes.form} noValidate onSubmit={onSubmit}>
      <Paper className={classes.paper}>
        <Typography>Create a post</Typography>
        <TextField
          label="Enter something interesting!"
          placeholder="I'm so happy!"
          onChange={onInput}
          className={classes.input}
        />
        {file && (
          <img className={classes.image} src={URL.createObjectURL(file)} />
        )}
        <input type="file" name="file" onChange={onFileChange} />
        <Button
          variant="contained"
          color="primary"
          className={classes.btn}
          type="submit"
        >
          {loading ? <CircularProgress /> : "Submit"}
        </Button>
        <Typography color="error">{error}</Typography>
      </Paper>
    </form>
  );
}

export default CreatePost;
