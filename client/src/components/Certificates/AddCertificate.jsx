import React, { useState, useRef, useEffect } from "react";
import axios from "../../utils/axios";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Card, Alert } from "react-bootstrap";

const defaultFont = {
  family: "Arial",
  size: 32,
  color: "#000000"
};

const defaultNamePosition = { x: 100, y: 100 };

const AddCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [namePosition, setNamePosition] = useState(defaultNamePosition);
  const [font, setFont] = useState(defaultFont);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const imgRef = useRef();

  // Fetch existing certificate data if present
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await axios.get(`/api/courses/${id}`);
        const cert = res.data.certificate;
        if (cert && cert.templateUrl) {
          setPreviewUrl(cert.templateUrl);
          if (cert.textSettings?.namePosition)
            setNamePosition(cert.textSettings.namePosition);
          if (cert.textSettings?.font)
            setFont(cert.textSettings.font);
        }
      } catch (err) {
        // ignore error
      }
    };
    fetchCertificate();
  }, [id]);

  // Handle template file change and preview
  const handleTemplateChange = (e) => {
    const file = e.target.files[0];
    setTemplate(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Set name position by clicking on the image
  const handleImageClick = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setNamePosition({ x, y });
  };

  // Handle font settings
  const handleFontChange = (e) => {
    const { name, value } = e.target;
    setFont((prev) => ({
      ...prev,
      [name]: name === "size" ? Number(value) : value
    }));
  };

  // Submit certificate template and settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const formData = new FormData();
      // Only append template if a new file is selected
      if (template) formData.append("template", template);
      formData.append("namePosition", JSON.stringify(namePosition));
      formData.append("font", JSON.stringify(font));
      await axios.post(`/api/courses/${id}/certificate-template`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSuccess("Certificate template uploaded and configured!");
      setTimeout(() => navigate(`/edit-courses/${id}`), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload certificate template");
    } finally {
      setLoading(false);
    }
  };

  const resetFormatting = () => {
    setFont(defaultFont);
    setNamePosition(defaultNamePosition);
  };

  return (
    <div className="container py-4">
      <Card>
        <Card.Body>
          <h4>Certificate Preview</h4>
          <div className="d-flex flex-wrap">
            <div style={{ flex: 2, minWidth: 350 }}>
              <div style={{ position: "relative", width: 500, height: 350, margin: "auto" }}>
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Certificate Template"
                    ref={imgRef}
                    style={{ width: "100%", height: "auto", cursor: "crosshair" }}
                    onClick={handleImageClick}
                  />
                )}
                {previewUrl && (
                  <div
                    style={{
                      position: "absolute",
                      left: namePosition.x,
                      top: namePosition.y,
                      fontFamily: font.family,
                      fontSize: font.size,
                      color: font.color,
                      fontWeight: "bold",
                      pointerEvents: "none"
                    }}
                  >
                    John Doe
                  </div>
                )}
              </div>
              <div className="text-center mt-2">
                <small>
                  Click on the certificate image to set the <b>name</b> position.
                </small>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 250, marginLeft: 30 }}>
              <h6>Text Design</h6>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>Font Size</Form.Label>
                  <Form.Range
                    min={10}
                    max={100}
                    value={font.size}
                    name="size"
                    onChange={handleFontChange}
                  />
                  <span>{font.size}px</span>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Font Color</Form.Label>
                  <Form.Control
                    type="color"
                    name="color"
                    value={font.color}
                    onChange={handleFontChange}
                  />
                  <span className="ms-2">{font.color}</span>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Font Family</Form.Label>
                  <Form.Select name="family" value={font.family} onChange={handleFontChange}>
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Verdana</option>
                    <option>Georgia</option>
                    <option>Courier New</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Name Position</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      name="x"
                      value={namePosition.x}
                      onChange={e => setNamePosition({ ...namePosition, x: Number(e.target.value) })}
                      placeholder="X"
                    />
                    <Form.Control
                      type="number"
                      name="y"
                      value={namePosition.y}
                      onChange={e => setNamePosition({ ...namePosition, y: Number(e.target.value) })}
                      placeholder="Y"
                    />
                  </div>
                  <Form.Text muted>
                    Or click on the certificate image to set position
                  </Form.Text>
                </Form.Group>
                <Button
                  variant="danger"
                  className="mt-2 mb-2"
                  onClick={resetFormatting}
                  type="button"
                >
                  Reset Formatting
                </Button>
                <Form.Group className="mb-2">
                  <Form.Label>Certificate Template (Image/PDF)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleTemplateChange}
                    // Only required if not editing
                    required={!previewUrl}
                  />
                </Form.Group>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Uploading..." : "Upload & Save"}
                </Button>
                <Button
                  variant="secondary"
                  className="ms-2"
                  onClick={() => navigate(`/edit-courses/${id}`)}
                >
                  Back
                </Button>
              </Form>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AddCertificate;