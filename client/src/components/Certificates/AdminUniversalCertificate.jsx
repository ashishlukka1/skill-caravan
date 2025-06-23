import React, { useState, useRef, useEffect } from "react";
import Moveable from "react-moveable";
import axios from "../../utils/axios";
import { Button, Form, Card, Alert } from "react-bootstrap";

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Verdana",
  "Georgia",
  "Courier New",
];

const defaultFont = {
  family: "Arial",
  color: "#000000",
  nameSize: 32,
  courseSize: 32,
  dateSize: 32,
  qrSize: 40,
};

const initialFields = [
  {
    key: "name",
    label: "User Name",
    text: "John Doe",
    x: 250,
    y: 120,
    width: 300,
    height: 60,
    fontSizeKey: "nameSize",
    editing: false,
  },
  {
    key: "course",
    label: "Course Name",
    text: "Course Name",
    x: 250,
    y: 200,
    width: 300,
    height: 60,
    fontSizeKey: "courseSize",
    editing: false,
  },
  {
    key: "date",
    label: "Awarded Date",
    text: "01/01/2025",
    x: 250,
    y: 280,
    width: 300,
    height: 60,
    fontSizeKey: "dateSize",
    editing: false,
  },
  {
    key: "qr",
    label: "QR",
    text: "QR",
    x: 600,
    y: 400,
    width: 80,
    height: 80,
    fontSizeKey: "qrSize",
    editing: false,
  },
];

const AdminUniversalCertificate = () => {
  const [template, setTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fields, setFields] = useState(initialFields);
  const [font, setFont] = useState(defaultFont);
  const [selectedField, setSelectedField] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingTemplateUrl, setExistingTemplateUrl] = useState("");
  const imgRef = useRef();
  const fieldRefs = useRef([]);

  // Convert px to percent
  const pxToPercent = (val, total) => (val / total) * 100;
  // Convert percent to px
  const percentToPx = (percent, total) => (percent / 100) * total;

  // Fetch existing universal certificate if present
  useEffect(() => {
    const fetchUniversal = async () => {
      try {
        const res = await axios.get("/api/courses/universal");
        if (res.data.templateUrl) {
          setPreviewUrl(res.data.templateUrl);
          setExistingTemplateUrl(res.data.templateUrl);
        }
        if (res.data.textSettings) {
          // If backend is already using percent-based boxes, convert to px for UI
          const { nameBox, courseBox, dateBox, qrBox, font: f } = res.data.textSettings;
          if (nameBox && courseBox && dateBox && qrBox) {
            setFields([
              {
                ...initialFields[0],
                x: percentToPx(nameBox.x, CANVAS_WIDTH),
                y: percentToPx(nameBox.y, CANVAS_HEIGHT),
                width: percentToPx(nameBox.width, CANVAS_WIDTH),
                height: percentToPx(nameBox.height, CANVAS_HEIGHT),
              },
              {
                ...initialFields[1],
                x: percentToPx(courseBox.x, CANVAS_WIDTH),
                y: percentToPx(courseBox.y, CANVAS_HEIGHT),
                width: percentToPx(courseBox.width, CANVAS_WIDTH),
                height: percentToPx(courseBox.height, CANVAS_HEIGHT),
              },
              {
                ...initialFields[2],
                x: percentToPx(dateBox.x, CANVAS_WIDTH),
                y: percentToPx(dateBox.y, CANVAS_HEIGHT),
                width: percentToPx(dateBox.width, CANVAS_WIDTH),
                height: percentToPx(dateBox.height, CANVAS_HEIGHT),
              },
              {
                ...initialFields[3],
                x: percentToPx(qrBox.x, CANVAS_WIDTH),
                y: percentToPx(qrBox.y, CANVAS_HEIGHT),
                width: percentToPx(qrBox.width, CANVAS_WIDTH),
                height: percentToPx(qrBox.height, CANVAS_HEIGHT),
              },
            ]);
          }
          if (f) setFont({ ...defaultFont, ...f });
        }
      } catch (err) {
        // ignore error if not set
      }
    };
    fetchUniversal();
    // eslint-disable-next-line
  }, []);

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

  // Moveable drag/resize handler (top-left based)
  const updateField = (key, updates) => {
    setFields((prev) =>
      prev.map((f) =>
        f.key === key
          ? {
              ...f,
              ...updates,
            }
          : f
      )
    );
  };

  // Edit text
  const handleEditText = (key, value) => {
    setFields((prev) =>
      prev.map((f) => (f.key === key ? { ...f, text: value } : f))
    );
  };

  // Font family/color/size change for selected field
  const handleFieldStyle = (key, styleKey, value) => {
    setFont((prev) =>
      styleKey === "family" || styleKey === "color"
        ? { ...prev, [styleKey]: value }
        : { ...prev, [styleKey]: Number(value) }
    );
  };

  // Submit universal certificate template and settings
  // ...existing code...
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError("");
  setSuccess("");
  try {
    const formData = new FormData();
    if (template) {
      formData.append("template", template); // File object
    }
    // Convert all fields to percent before sending
    const textSettings = {
      nameBox: {
        x: pxToPercent(fields[0].x, CANVAS_WIDTH),
        y: pxToPercent(fields[0].y, CANVAS_HEIGHT),
        width: pxToPercent(fields[0].width, CANVAS_WIDTH),
        height: pxToPercent(fields[0].height, CANVAS_HEIGHT),
      },
      courseBox: {
        x: pxToPercent(fields[1].x, CANVAS_WIDTH),
        y: pxToPercent(fields[1].y, CANVAS_HEIGHT),
        width: pxToPercent(fields[1].width, CANVAS_WIDTH),
        height: pxToPercent(fields[1].height, CANVAS_HEIGHT),
      },
      dateBox: {
        x: pxToPercent(fields[2].x, CANVAS_WIDTH),
        y: pxToPercent(fields[2].y, CANVAS_HEIGHT),
        width: pxToPercent(fields[2].width, CANVAS_WIDTH),
        height: pxToPercent(fields[2].height, CANVAS_HEIGHT),
      },
      qrBox: {
        x: pxToPercent(fields[3].x, CANVAS_WIDTH),
        y: pxToPercent(fields[3].y, CANVAS_HEIGHT),
        width: pxToPercent(fields[3].width, CANVAS_WIDTH),
        height: pxToPercent(fields[3].height, CANVAS_HEIGHT),
      },
      font,
    };
    formData.append("textSettings", JSON.stringify(textSettings));
    await axios.post("/api/courses/universal", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setSuccess("Universal certificate template updated!");
    if (template) {
      setExistingTemplateUrl(previewUrl);
    }
  } catch (err) {
    setError(
      err.response?.data?.message || "Failed to update universal certificate"
    );
  } finally {
    setLoading(false);
  }
};
// ...existing code...

  const resetFormatting = () => {
    setFont(defaultFont);
    setFields(initialFields);
    setSelectedField(null);
  };

  // For drag/resize overlays (top-left, but backend uses percent box)
  const getFieldStyle = (field) => ({
    position: "absolute",
    left: field.x * zoom,
    top: field.y * zoom,
    width: field.width * zoom,
    height: field.height * zoom,
    background:
      selectedField === field.key
        ? "#eaf6ff"
        : "rgba(255,255,255,0.0)",
    border:
      selectedField === field.key
        ? "2px solid #007bff"
        : "1px solid #bbb",
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "move",
    zIndex: 2,
    overflow: "hidden",
    boxShadow:
      selectedField === field.key
        ? "0 0 8px #007bff55"
        : undefined,
    fontFamily: font.family,
    fontSize: font[field.fontSizeKey] * zoom,
    color: font.color,
    fontWeight: "bold",
    textAlign: "center",
    padding: 2,
    transition: "border 0.1s",
    userSelect: "none",
  });

  return (
    <div className="container py-4 mt-5">
      <Card className="mt-3">
        <Card.Body>
          <h4>Certificate Template Designer</h4>
          <div className="mb-3">
            <Form.Label>Zoom: {Math.round(zoom * 100)}%</Form.Label>
            <Form.Range
              min={0.5}
              max={2}
              step={0.05}
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              style={{ width: 200 }}
            />
          </div>
          <div className="d-flex flex-wrap">
            <div style={{ flex: 2, minWidth: 350 }}>
              <div
                style={{
                  position: "relative",
                  width: CANVAS_WIDTH * zoom,
                  height: CANVAS_HEIGHT * zoom,
                  margin: "auto",
                  border: "1px solid #ddd",
                  background: "#fafafa",
                  overflow: "hidden",
                  boxShadow: "0 2px 12px #0001",
                  userSelect: "none",
                }}
                onClick={() => setSelectedField(null)}
              >
                {/* Render the image as a background layer */}
                {(previewUrl || existingTemplateUrl) && (
                  <img
                    src={previewUrl || existingTemplateUrl}
                    alt="Certificate Template"
                    ref={imgRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      pointerEvents: "none",
                      userSelect: "none",
                      position: "absolute",
                      left: 0,
                      top: 0,
                      zIndex: 0,
                    }}
                    draggable={false}
                  />
                )}
                {/* Render text fields above the image */}
                {fields.map((field, idx) => (
                  <React.Fragment key={field.key}>
                    <div
                      ref={el => (fieldRefs.current[idx] = el)}
                      style={getFieldStyle(field)}
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedField(field.key);
                      }}
                      onDoubleClick={e => {
                        e.stopPropagation();
                        setFields((prev) =>
                          prev.map((f) =>
                            f.key === field.key
                              ? { ...f, editing: true }
                              : { ...f, editing: false }
                          )
                        );
                      }}
                    >
                      {field.editing ? (
                        <textarea
                          autoFocus
                          value={field.text}
                          onChange={e =>
                            handleEditText(field.key, e.target.value)
                          }
                          onBlur={() =>
                            setFields(prev =>
                              prev.map(f =>
                                f.key === field.key
                                  ? { ...f, editing: false }
                                  : f
                              )
                            )
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            background: "transparent",
                            border: "none",
                            outline: "none",
                            fontFamily: font.family,
                            fontSize: font[field.fontSizeKey] * zoom,
                            color: font.color,
                            fontWeight: "bold",
                            textAlign: "center",
                            resize: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            width: "100%",
                            textAlign: "center",
                            whiteSpace: "pre-line",
                            pointerEvents: "none",
                          }}
                        >
                          {field.text}
                        </span>
                      )}
                    </div>
                    {selectedField === field.key && (
                      <Moveable
                        target={fieldRefs.current[idx]}
                        origin={false}
                        edge={false}
                        draggable={true}
                        resizable={true}
                        throttleDrag={0}
                        throttleResize={0}
                        keepRatio={false}
                        onDrag={({ left, top }) => {
                          window.requestAnimationFrame(() => {
                            updateField(field.key, {
                              x: Math.round(left / zoom),
                              y: Math.round(top / zoom),
                            });
                          });
                        }}
                        onResize={({ width, height, drag }) => {
                          window.requestAnimationFrame(() => {
                            updateField(field.key, {
                              width: Math.max(60, width / zoom),
                              height: Math.max(30, height / zoom),
                              x: Math.round(drag.left / zoom),
                              y: Math.round(drag.top / zoom),
                            });
                          });
                        }}
                        renderDirections={["nw", "ne", "sw", "se"]}
                        padding={{ left: 0, top: 0, right: 0, bottom: 0 }}
                        snappable={true}
                        snapThreshold={5}
                        bounds={{
                          left: 0,
                          top: 0,
                          right: CANVAS_WIDTH * zoom,
                          bottom: CANVAS_HEIGHT * zoom,
                        }}
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="text-center mt-2">
                <small>
                  Drag, resize, and double-click to edit each text box.<br />
                  Only User Name, Course Name, Awarded Date, and QR fields are available.
                </small>
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 250, marginLeft: 30 }}>
              <h6>Text Field Design</h6>
              {selectedField && (() => {
                const field = fields.find(f => f.key === selectedField);
                if (!field) return null;
                return (
                  <div className="mb-3 p-2 border rounded bg-light">
                    <h6 className="mb-2">{field.label} Box</h6>
                    <Form.Group className="mb-2">
                      <Form.Label>Font Family</Form.Label>
                      <Form.Select
                        value={font.family}
                        onChange={e =>
                          handleFieldStyle(field.key, "family", e.target.value)
                        }
                      >
                        {fontFamilies.map(f => (
                          <option key={f}>{f}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Font Size</Form.Label>
                      <Form.Range
                        min={10}
                        max={100}
                        value={font[field.fontSizeKey]}
                        onChange={e =>
                          handleFieldStyle(
                            field.key,
                            field.fontSizeKey,
                            Number(e.target.value)
                          )
                        }
                      />
                      <span>{font[field.fontSizeKey]}px</span>
                    </Form.Group>
                    <Form.Group className="mb-2">
                      <Form.Label>Font Color</Form.Label>
                      <Form.Control
                        type="color"
                        value={font.color}
                        onChange={e =>
                          handleFieldStyle(field.key, "color", e.target.value)
                        }
                      />
                      <span className="ms-2">{font.color}</span>
                    </Form.Group>
                  </div>
                );
              })()}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-2">
                  <Form.Label>Certificate Template (Image/PDF)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleTemplateChange}
                  />
                </Form.Group>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Button
                  variant="danger"
                  className="mt-2 mb-2 me-2"
                  onClick={resetFormatting}
                  type="button"
                >
                  Reset Formatting
                </Button>
                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? "Uploading..." : "Upload & Save"}
                </Button>
              </Form>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AdminUniversalCertificate;