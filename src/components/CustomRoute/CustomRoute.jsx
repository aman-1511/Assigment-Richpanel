import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/auth";

const CustomRoute = ({
  element,
  visibleToAuthenticatedUser = true,
  visibleToUnauthenticatedUser = true,
}) => {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.isInitialised) {
      if (visibleToUnauthenticatedUser === false && auth.isLoggedIn === false) {
        
        navigate("/login");
      } else if (
        visibleToAuthenticatedUser === false &&
        auth.isLoggedIn == true
      ) {
      
        navigate("/connect-page");
      } else if (visibleToAuthenticatedUser && visibleToAuthenticatedUser) {
        
      }
    }
  }, [auth]);

  return element || null;
};

export default CustomRoute;
