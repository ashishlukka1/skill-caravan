import React from "react";
import { Card, Button } from "react-bootstrap";

const CertificateDisplay = ({ cert, onDownload, showDownload = true }) => (
  <Card className="h-100 shadow-sm d-flex flex-column align-items-stretch" style={{ minHeight: 420 }}>
    <div
      style={{
        background: "#f8f9fa",
        padding: 10,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: 280,
        justifyContent: "center"
      }}
    >
      <img
        src={cert.certificateUrl}
        alt={`Certificate for ${cert.courseTitle}`}
        style={{
          objectFit: "contain",
          maxHeight: 220,
          width: "100%",
          borderRadius: 8,
          display: "block"
        }}
        crossOrigin="anonymous"
      />
      <div style={{ padding: 8, width: "100%" }}>
        <div>
          <strong>Course:</strong> {cert.courseTitle || "Unknown Course"}
        </div>
        <strong>Certificate ID:</strong> {cert.certificateId || "N/A"}
        <div>
          <strong>Issued At:</strong>{" "}
          {cert.issuedAt
            ? new Date(cert.issuedAt).toLocaleDateString()
            : "N/A"}
        </div>
      </div>
    </div>
    {showDownload && (
      <Card.Body className="d-flex flex-column justify-content-end">
        <div className="d-flex gap-2">
          <Button
            variant="outline-primary"
            href={cert.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-fill"
          >
            View
          </Button>
          <Button
            variant="outline-secondary"
            onClick={onDownload}
            className="flex-fill"
          >
            Download PDF
          </Button>
        </div>
      </Card.Body>
    )}
  </Card>
);

export default CertificateDisplay;