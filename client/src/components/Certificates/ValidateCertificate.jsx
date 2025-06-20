import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "../../utils/axios";
import { Container, Spinner, Row, Col } from "react-bootstrap";
import "./ValidateCertificate.css"; // Import the custom CSS

const ValidateCertificate = () => {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCertificate = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`/api/courses/validate-certificate/${certId}`);
        setCertificate(res.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Certificate not found or invalid."
        );
      } finally {
        setLoading(false);
      }
    };
    if (certId) fetchCertificate();
  }, [certId]);

  return (
    <div className="certificate-validation-page">
      <Container fluid className="py-4">
        {/* Header */}
        <div className="validation-header">
          <h1 className="page-title">Certificate Validation</h1>
          {!loading && !error && certificate && (
            <div className="verification-badge">
              <i className="fas fa-check-circle"></i>
              <span>Certificate Verified</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="loading-container">
            <Spinner animation="border" className="custom-spinner" />
            <p className="loading-text">Validating certificate...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <div className="error-icon">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="error-title">Certificate Not Found</h3>
            <p className="error-message">{error}</p>
          </div>
        ) : (
          <Row className="certificate-content">
            {/* Certificate Display */}
            <Col lg={6} className="certificate-column">
              <div className="certificate-display">
                {certificate.certificateUrl ? (
                  <img
                    src={certificate.certificateUrl}
                    alt="Certificate"
                    className="certificate-image"
                  />
                ) : (
                  <div className="certificate-placeholder">
                    <i className="fas fa-certificate"></i>
                    <p>Certificate Image Not Available</p>
                  </div>
                )}
              </div>
            </Col>

            {/* Certificate Details */}
            <Col lg={6} className="details-column">
              <div className="certificate-details">
                <div className="detail-section">
                  <h3>This certificate was issued for:</h3>
                  <div className="recipient-name">{certificate.userName}</div>
                </div>

                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">Certification:</span>
                    <span className="detail-value">{certificate.courseTitle}</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">Issue date:</span>
                    <span className="detail-value">
                      {certificate.issuedAt
                        ? new Date(certificate.issuedAt).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">This certificate was issued by:</span>
                    <span className="detail-value">Olive Crypto Systems Pvt Ltd</span>
                  </div>
                </div>

                <div className="detail-section">
                  <div className="detail-row">
                    <span className="detail-label">Certificate ID:</span>
                    <span className="detail-value certificate-id">{certificate.certificateId}</span>
                  </div>
                </div>

                
              </div>
            </Col>
          </Row>
        )}

        {/* About Section */}
        {!loading && !error && certificate && (
          <div className="about-section">
            <h2>About this Certificate</h2>
            <p>
              The validity of this certificate is ensured by us and can be verified by the certificate identifier above.
              It was created for the person on the certificate and issued with above purpose.
            </p>
          </div>
        )}
      </Container>
    </div>
  );
};

export default ValidateCertificate;