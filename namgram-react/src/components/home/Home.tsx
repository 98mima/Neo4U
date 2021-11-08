import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import { RootState } from "../../redux";

function Home() {
  const history = useHistory();
  const auth = useSelector((state: RootState) => state.auth.auth);

  useEffect(() => {
    if (auth) history.push("/posts");
    else history.push("/signin/");
    return () => {};
  }, [auth]);
  return <div>Dobar dan</div>;
}

export default Home;
