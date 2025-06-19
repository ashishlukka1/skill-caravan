import React, { useState, useRef, useEffect } from "react";
import axios from "../../utils/axios";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Form, Card, Alert } from "react-bootstrap";

const defaultFont = {
  family: "Arial",
  color: "#000000",
  nameSize: 32,
  courseSize: 32,
  dateSize: 32,
  qrSize: 80,
};
const defaultNamePosition = { x: 100, y: 100 };
const defaultCoursePosition = { x: 100, y: 200 };
const defaultDatePosition = { x: 100, y: 300 };
const defaultQrPosition = { x: 400, y: 350 };

const AddCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [namePosition, setNamePosition] = useState(defaultNamePosition);
  const [coursePosition, setCoursePosition] = useState(defaultCoursePosition);
  const [datePosition, setDatePosition] = useState(defaultDatePosition);
  const [qrPosition, setQrPosition] = useState(defaultQrPosition);
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
          if (cert.textSettings?.coursePosition)
            setCoursePosition(cert.textSettings.coursePosition);
          if (cert.textSettings?.datePosition)
            setDatePosition(cert.textSettings.datePosition);
          if (cert.textSettings?.qrPosition)
            setQrPosition(cert.textSettings.qrPosition);
          if (cert.textSettings?.font)
            setFont({ ...defaultFont, ...cert.textSettings.font });
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

  // Set position by clicking on the image
  const handleImageClick = (e, field) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const scaleX = imgRef.current.naturalWidth / rect.width;
    const scaleY = imgRef.current.naturalHeight / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    if (field === "name") setNamePosition({ x, y });
    if (field === "course") setCoursePosition({ x, y });
    if (field === "date") setDatePosition({ x, y });
    if (field === "qr") setQrPosition({ x, y });
  };

  // Font family/color/size
  const handleFontChange = (e) => {
    const { name, value } = e.target;
    setFont((prev) => ({
      ...prev,
      [name]: name.includes("Size") ? Number(value) : value,
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
      if (template) formData.append("template", template);
      formData.append("namePosition", JSON.stringify(namePosition));
      formData.append("coursePosition", JSON.stringify(coursePosition));
      formData.append("datePosition", JSON.stringify(datePosition));
      formData.append("qrPosition", JSON.stringify(qrPosition));
      formData.append("font", JSON.stringify(font));
      await axios.post(`/api/courses/${id}/certificate-template`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess("Certificate template uploaded and configured!");
      setTimeout(() => navigate(`/edit-courses/${id}`), 1200);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to upload certificate template"
      );
    } finally {
      setLoading(false);
    }
  };

  const resetFormatting = () => {
    setFont(defaultFont);
    setNamePosition(defaultNamePosition);
    setCoursePosition(defaultCoursePosition);
    setDatePosition(defaultDatePosition);
    setQrPosition(defaultQrPosition);
  };

  // Overlay helpers
  const getOverlayStyle = (pos, sizeKey) => {
    if (!imgRef.current) return { display: "none" };
    const naturalWidth = imgRef.current.naturalWidth || 500;
    const naturalHeight = imgRef.current.naturalHeight || 350;
    const width = 500;
    const height = 350;
    return {
      position: "absolute",
      left: pos.x * (width / naturalWidth),
      top: pos.y * (height / naturalHeight),
      fontFamily: font.family,
      fontSize: font[sizeKey] * (width / naturalWidth),
      color: font.color,
      fontWeight: "bold",
      pointerEvents: "none",
    };
  };

  const getQrStyle = (pos) => {
    if (!imgRef.current) return { display: "none" };
    const naturalWidth = imgRef.current.naturalWidth || 500;
    const naturalHeight = imgRef.current.naturalHeight || 350;
    const width = 500;
    const height = 350;
    const size = font.qrSize * (width / naturalWidth);
    return {
      position: "absolute",
      left: pos.x * (width / naturalWidth),
      top: pos.y * (height / naturalHeight),
      width: size,
      height: size,
      background: "#eee",
      border: "1px dashed #aaa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    };
  };

  // Click-to-set-position logic
  const setPositionByClick = (field) => {
    alert(`Click on the certificate image to set the ${field} position.`);
    if (!imgRef.current) return;
    imgRef.current.style.cursor = "crosshair";
    const handler = (e) => {
      handleImageClick(e, field);
      imgRef.current.style.cursor = "pointer";
      imgRef.current.removeEventListener("click", handler);
    };
    imgRef.current.addEventListener("click", handler);
  };

  return (
    <div className="container py-4 min-vh-100 mt-5">
      <Card className="mt-3 p-3">
        <Card.Body>
          {/* <h4>Certificate Preview</h4> */}
          <div className="d-flex flex-wrap">
            <div style={{ flex: 2, minWidth: 350 }}>
              <div
                style={{
                  position: "relative",
                  width: 500,
                  height: 350,
                  margin: "auto",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                }}
              >
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Certificate Template"
                    ref={imgRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      cursor: "pointer",
                    }}
                  />
                )}
                {previewUrl && (
                  <>
                    <div style={getOverlayStyle(namePosition, "nameSize")}>
                      John Doe
                    </div>
                    <div style={getOverlayStyle(coursePosition, "courseSize")}>
                      Course Name
                    </div>
                    <div style={getOverlayStyle(datePosition, "dateSize")}>
                      01/01/2025
                    </div>
                    <div style={getQrStyle(qrPosition)}>QR</div>
                  </>
                )}
              </div>
              <div className="text-center mt-2">
                <small>
                  Use "Set Position" then click on the image to set each field's position.
                </small>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 250, marginLeft: 30 }}>
              <h6>Text & QR Design</h6>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>Font Family</Form.Label>
                  <Form.Select
                    name="family"
                    value={font.family}
                    onChange={handleFontChange}
                  >
                    <option>Arial</option>
                    <option>Times New Roman</option>
                    <option>Verdana</option>
                    <option>Georgia</option>
                    <option>Courier New</option>
                  </Form.Select>
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
                  <Form.Label>User Name Size</Form.Label>
                  <Form.Range
                    min={10}
                    max={100}
                    value={font.nameSize}
                    name="nameSize"
                    onChange={handleFontChange}
                  />
                  <span>{font.nameSize}px</span>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Course Name Size</Form.Label>
                  <Form.Range
                    min={10}
                    max={100}
                    value={font.courseSize}
                    name="courseSize"
                    onChange={handleFontChange}
                  />
                  <span>{font.courseSize}px</span>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Date Size</Form.Label>
                  <Form.Range
                    min={10}
                    max={100}
                    value={font.dateSize}
                    name="dateSize"
                    onChange={handleFontChange}
                  />
                  <span>{font.dateSize}px</span>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>QR Code Size</Form.Label>
                  <Form.Range
                    min={40}
                    max={200}
                    value={font.qrSize}
                    name="qrSize"
                    onChange={handleFontChange}
                  />
                  <span>{font.qrSize}px</span>
                </Form.Group>
                {/* Position fields for each certificate field */}
                <Form.Group className="mb-2">
                  <Form.Label>Name Position</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      name="x"
                      value={namePosition.x}
                      onChange={e =>
                        setNamePosition({ ...namePosition, x: Number(e.target.value) })
                      }
                      placeholder="X"
                    />
                    <Form.Control
                      type="number"
                      name="y"
                      value={namePosition.y}
                      onChange={e =>
                        setNamePosition({ ...namePosition, y: Number(e.target.value) })
                      }
                      placeholder="Y"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      type="button"
                      onClick={() => setPositionByClick("name")}
                    >
                      Set Position
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Course Name Position</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      name="x"
                      value={coursePosition.x}
                      onChange={e =>
                        setCoursePosition({ ...coursePosition, x: Number(e.target.value) })
                      }
                      placeholder="X"
                    />
                    <Form.Control
                      type="number"
                      name="y"
                      value={coursePosition.y}
                      onChange={e =>
                        setCoursePosition({ ...coursePosition, y: Number(e.target.value) })
                      }
                      placeholder="Y"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      type="button"
                      onClick={() => setPositionByClick("course")}
                    >
                      Set Position
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>Date Awarded Position</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      name="x"
                      value={datePosition.x}
                      onChange={e =>
                        setDatePosition({ ...datePosition, x: Number(e.target.value) })
                      }
                      placeholder="X"
                    />
                    <Form.Control
                      type="number"
                      name="y"
                      value={datePosition.y}
                      onChange={e =>
                        setDatePosition({ ...datePosition, y: Number(e.target.value) })
                      }
                      placeholder="Y"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      type="button"
                      onClick={() => setPositionByClick("date")}
                    >
                      Set Position
                    </Button>
                  </div>
                </Form.Group>
                <Form.Group className="mb-2">
                  <Form.Label>QR Code Position</Form.Label>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="number"
                      name="x"
                      value={qrPosition.x}
                      onChange={e =>
                        setQrPosition({ ...qrPosition, x: Number(e.target.value) })
                      }
                      placeholder="X"
                    />
                    <Form.Control
                      type="number"
                      name="y"
                      value={qrPosition.y}
                      onChange={e =>
                        setQrPosition({ ...qrPosition, y: Number(e.target.value) })
                      }
                      placeholder="Y"
                    />
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      type="button"
                      onClick={() => setPositionByClick("qr")}
                    >
                      Set Position
                    </Button>
                  </div>
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