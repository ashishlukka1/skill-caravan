import React, { useContext } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

const CheckerRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const params = useParams();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (user.role !== "checker") {
    // Not a checker, let through (for admin/instructor/student)
    return children;
  }

  // Allow only /checker-dashboard and /review-course/:id for checkers
  const allowedPaths = [
    "/checker-dashboard",
    `/review-course/${params.id || ""}`,
  ];

  // Allow /review-course/:id for any id
  if (
    location.pathname === "/checker-dashboard" ||
    location.pathname.startsWith("/review-course/")
  ) {
    return children;
  }

  // For any other route, redirect to checker-dashboard
  return <Navigate to="/checker-dashboard" />;
};

export default CheckerRoute;