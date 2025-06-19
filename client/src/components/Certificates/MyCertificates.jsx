import React, { useEffect, useState, useRef } from "react";
import axios from "../../utils/axios";
import { Card, Spinner, Alert, Container, Row, Col, Button } from "react-bootstrap";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const imgRefs = useRef({});

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/api/courses/my-courses/my-certificates");
        if (res.data && Array.isArray(res.data.certificates)) {
          setCertificates(res.data.certificates);
        } else {
          setCertificates([]);
        }
      } catch (err) {
        console.error("Error fetching certificates:", err);
        setError(
          err.response?.data?.message || "Failed to fetch certificates"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

  const handleDownloadPDF = async (cert, idx) => {
    const img = imgRefs.current[cert.certificateId || idx];
    if (!img) return;

    // Wait for image to load
    if (!img.complete) {
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    }

    // Create a canvas from the image
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "px",
      format: [canvas.width, canvas.height],
    });
    pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);

    // Optionally add course title and certificate ID
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    pdf.text(cert.courseTitle || "", 30, 40);
    pdf.setFontSize(14);
    pdf.text(`Certificate ID: ${cert.certificateId || ""}`, 30, 60);

    pdf.save(
      `${cert.courseTitle || "certificate"}-${cert.certificateId || ""}.pdf`
    );
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4 min-vh-100">
      <h2 className="mb-4 text-center">My Certificates</h2>
      {certificates.length === 0 ? (
        <Alert variant="info" className="text-center">
          You have not received any certificates yet.
        </Alert>
      ) : (
        <Row className="g-4">
          {certificates.map((cert, idx) => (
            <Col md={6} lg={4} key={cert.certificateId || idx}>
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
                    ref={el => (imgRefs.current[cert.certificateId || idx] = el)}
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
                    onError={e => {
                      e.target.style.display = "none";
                    }}
                  />
                  <div style={{ padding: 8, width: "100%" }}>
                    <div>
                      <strong>Course:</strong> {cert.courseTitle || "Unknown Course"}
                    </div>
            
                    <div>
                      <strong>Issued At:</strong>{" "}
                      {cert.issuedAt
                        ? new Date(cert.issuedAt).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                </div>
                <Card.Body className="d-flex flex-column justify-content-end">
                  <div className="d-grid gap-2">
                    {cert.certificateUrl && (
                      <>
                        <Button
                          variant="outline-primary"
                          href={cert.certificateUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          View
                        </Button>
                        
                        <Button
                          variant="outline-secondary"
                          onClick={() => handleDownloadPDF(cert, idx)}
                        >
                          Download PDF
                        </Button>
                      </>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default MyCertificates;