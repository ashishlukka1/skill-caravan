import React from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const TopRightAlert = ({ show, variant, message, onClose }) => {
  const iconMap = {
    success: <FaCheckCircle style={{ fontSize: 20, marginRight: 12 }} />,
    error: <FaTimes style={{ fontSize: 20, marginRight: 12 }} />,
    info: <span style={{ fontSize: 20, marginRight: 12 }}>ℹ️</span>,
  };
  const backgroundMap = {
    success: "rgb(115, 182, 118)",
    error: " #F44336",
    info: " #2196F3",
  };
  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{
        zIndex: 1060,
        position: "fixed",
        top: 0,
        right: 0,
      }}
    >
      <Toast
        show={show}
        onClose={onClose}
        delay={4000}
        autohide
        style={{
          backgroundColor: backgroundMap[variant],
          border: "none",
          borderRadius: "8px",
          minWidth: "320px",
          maxWidth: "440px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          wordBreak: "break-word",
        }}
      >
        <Toast.Body
          className="d-flex align-items-center text-white p-3"
          style={{
            whiteSpace: "pre-line",
            flexWrap: "nowrap",
            alignItems: "center",
            paddingRight: 0,
          }}
        >
          {iconMap[variant]}
          <span
            style={{
              fontSize: "15px",
              fontWeight: 500,
              wordBreak: "break-word",
              whiteSpace: "pre-line",
              flex: 1,
              lineHeight: 1.5,
            }}
          >
            {message}
          </span>
          <span
            style={{
              display: "flex",
              alignItems: "center",
              height: "100%",
              marginLeft: 16,
            }}
          >
            <FaTimes
              style={{
                cursor: "pointer",
                fontSize: 18,
                opacity: 0.85,
              }}
              onClick={onClose}
            />
          </span>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default TopRightAlert;