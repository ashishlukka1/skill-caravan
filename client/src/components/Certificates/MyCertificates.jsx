import React, { useEffect, useState } from "react";
import axios from "../../utils/axios";
import { Card, Spinner, Alert, Container, Row, Col, Button } from "react-bootstrap";

function MyCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("/api/courses/my-courses/my-certificates");
        // Add better error handling for response data
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
              <Card className="h-100 shadow-sm">
                <Card.Img
                  variant="top"
                  src={cert.certificateUrl}
                  alt={`Certificate for ${cert.courseTitle}`}
                  style={{
                    objectFit: "contain",
                    maxHeight: 220,
                    background: "#f8f9fa",
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <Card.Body>
                  <Card.Title className="mb-2">{cert.courseTitle || "Unknown Course"}</Card.Title>
                  <Card.Text>
                    <strong>Certificate ID:</strong> {cert.certificateId || "N/A"}
                    <br />
                    <strong>Issued At:</strong>{" "}
                    {cert.issuedAt
                      ? new Date(cert.issuedAt).toLocaleDateString()
                      : "N/A"}
                  </Card.Text>
                  {cert.certificateUrl && (
                    <Button
                      variant="outline-primary"
                      href={cert.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-100"
                    >
                      View / Download
                    </Button>
                  )}
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
