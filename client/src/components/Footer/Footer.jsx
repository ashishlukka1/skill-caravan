import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsLinkedin, BsTwitter, BsDiscord } from 'react-icons/bs';
import './Footer.css';


const Footer = () => {
  return (
    <footer className="footer">
      <Container>
        <Row className="align-items-center">
          <Col md={4} className="footer-left">
            <div className="powered-by">
              <img 
                src="https://storage.googleapis.com/skcn-prod-mb-public-tenants/logo/0b250aa2-3030-4772-98e7-a0c5938a771c.png" 
                alt="Skills Caravan Logo" 
                className="footer-logo"
              />
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
            <div className="social-links">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                <BsLinkedin />
              </a>
              <a href="https://discord.com" target="_blank" rel="noopener noreferrer">
                <BsDiscord />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                <BsTwitter />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;