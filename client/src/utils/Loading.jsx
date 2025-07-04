import React from "react";
import { Spinner } from "react-bootstrap";

const Loading = ({ message = "Loading..." }) => (
  <div className="loading-overlay d-flex flex-column align-items-center justify-content-center">
    <Spinner animation="border" variant="primary" />
    <div className="mt-3 text-black fw-semibold">{message}</div>
  </div>
);

export default Loading;