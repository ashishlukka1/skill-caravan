import React, { useRef } from "react";
import Moveable from "react-moveable";
import { Card, Form, Row, Col, Button } from "react-bootstrap";

const fontFamilies = [
  "Arial",
  "Times New Roman",
  "Verdana",
  "Georgia",
  "Courier New",
];

const CertificateEditor = ({
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  previewUrl,
  fields,
  setFields,
  font,
  setFont,
  selectedField,
  setSelectedField,
  zoom,
  setZoom,
  handleTemplateChange,
  handleFieldStyle,
  handleEditText,
  updateField,
  fieldRefs,
  imgRef,
  sidebarActions,
  templateLabel = "Certificate Template (Image Only)",
  showTemplateInput = true,
}) => (
  <Card className="mt-3">
    <Card.Body>
      <div className="mb-3">
        <Form.Label className="me-2">Zoom: {Math.round(zoom * 100)}%</Form.Label>
        <Form.Range
          min={0.5}
          max={2}
          step={0.05}
          value={zoom}
          onChange={e => setZoom(Number(e.target.value))}
          style={{ width: 200 }}
          className="pt-2"
        />
      </div>
      <Row className="g-4">
        <Col xs={12} md={7} lg={8}>
          <div
            className="certificate-canvas-wrap"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: CANVAS_WIDTH * zoom,
              margin: "0 auto",
              overflowX: "auto",
            }}
          >
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
              {previewUrl && (
                <img
                  src={previewUrl}
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
              {fields.map((field, idx) => (
                <React.Fragment key={field.key}>
                  <div
                    ref={el => (fieldRefs.current[idx] = el)}
                    style={{
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
                      lineHeight: 1,
                    }}
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
                          lineHeight: 1,
                        }}
                      />
                    ) : (
                      <span
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          whiteSpace: "pre-line",
                          pointerEvents: "none",
                          fontFamily: font.family,
                          fontSize: font[field.fontSizeKey] * zoom,
                          color: font.color,
                          fontWeight: "bold",
                          lineHeight: 1,
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
        </Col>
        <Col xs={12} md={5} lg={4}>
          <div className="certificate-sidebar">
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
            {showTemplateInput && (
              <Form.Group className="mb-2">
                <Form.Label>{templateLabel}</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleTemplateChange}
                />
              </Form.Group>
            )}
            {sidebarActions}
          </div>
        </Col>
      </Row>
    </Card.Body>
  </Card>
);

export default CertificateEditor;