import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import CertificateEditor from "./CertificateEditor";
import TopRightAlert from "../../utils/TopRightAlert";
import { pxToPercent, percentToPx } from "../../utils/CertificateUtils";
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  initialFields,
} from "./certificateDefaults";
import { Button, Form } from "react-bootstrap";

const defaultFont = {
  family: "Arial",
  color: "#000000",
  nameSize: 32,
  courseSize: 32,
  dateSize: 32,
  qrSize: 80,
};

const AddCertificate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [fields, setFields] = useState(initialFields);
  const [font, setFont] = useState(defaultFont);
  const [selectedField, setSelectedField] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const imgRef = useRef();
  const fieldRefs = useRef([]);

  // Alert states
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Fetch existing certificate data if present
  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const res = await axios.get(`/api/courses/${id}`);
        const cert = res.data.certificate;
        if (cert && cert.templateUrl) {
          setPreviewUrl(cert.templateUrl);
        }
        if (cert && cert.textSettings) {
          const {
            nameBox,
            courseBox,
            dateBox,
            qrBox,
            font: f,
          } = cert.textSettings;
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
    fetchCertificate();
    // eslint-disable-next-line
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

  // Submit course certificate template and settings (course-specific route)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMessage("");
    setShowSuccessAlert(false);
    setShowErrorAlert(false);
    try {
      const formData = new FormData();
      if (template) {
        formData.append("template", template); // File object
      }
      // Compose namePosition and font as expected by backend
      const namePosition = {
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
      };
      formData.append("namePosition", JSON.stringify(namePosition));
      formData.append("font", JSON.stringify(font));
      await axios.post(`/api/courses/${id}/certificate-template`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setAlertMessage("Certificate template uploaded and configured!");
      setShowSuccessAlert(true);
      setTimeout(() => navigate(`/edit-courses/${id}`), 1200);
    } catch (err) {
      const msg =
        err.response?.data?.message || "Failed to upload certificate template";
      setAlertMessage(msg);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  const resetFormatting = () => {
    setFont(defaultFont);
    setFields(initialFields);
    setSelectedField(null);
  };

  return (
    <div className="container py-4 mt-5">
      <TopRightAlert
        show={showSuccessAlert}
        variant="success"
        message={alertMessage}
        onClose={() => setShowSuccessAlert(false)}
      />
      <TopRightAlert
        show={showErrorAlert}
        variant="error"
        message={alertMessage}
        onClose={() => setShowErrorAlert(false)}
      />
      <CertificateEditor
        CANVAS_WIDTH={CANVAS_WIDTH}
        CANVAS_HEIGHT={CANVAS_HEIGHT}
        previewUrl={previewUrl}
        fields={fields}
        setFields={setFields}
        font={font}
        setFont={setFont}
        selectedField={selectedField}
        setSelectedField={setSelectedField}
        zoom={zoom}
        setZoom={setZoom}
        handleTemplateChange={handleTemplateChange}
        handleFieldStyle={handleFieldStyle}
        handleEditText={handleEditText}
        updateField={updateField}
        fieldRefs={fieldRefs}
        imgRef={imgRef}
        sidebarActions={
          <Form onSubmit={handleSubmit}>
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
            <Button
              variant="secondary"
              className="ms-2"
              onClick={() => navigate(`/edit-courses/${id}`)}
            >
              Back
            </Button>
          </Form>
        }
      />
    </div>
  );
};

export default AddCertificate;
