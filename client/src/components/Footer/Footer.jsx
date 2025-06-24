import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="footer-left">
            <div className="powered-by">
              <a href="https://olivecrypto.com/" target='_blank' rel="noopener noreferrer">
                <img 
                  src="https://storage.googleapis.com/skcn-prod-mb-public-tenants/logo/0b250aa2-3030-4772-98e7-a0c5938a771c.png" 
                  alt="Skills Caravan Logo" 
                  className="footer-logo"
                />
              </a>
            </div>
          </Col>
          <Col md={4} className="footer-center">
            <div className="footer-links">
              <Link to="/privacy-policy">Privacy Policy</Link>
              <span className="separator">|</span>
              <Link to="/contact">Contact Us</Link>
            </div>
          </Col>
          <Col md={4} className="footer-right">
            <div className="copyright">
              © 2025 Olive Crypto Systems Pvt. Ltd., All rights reserved
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
