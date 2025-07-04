import React, { useState } from "react";
import { Button, Form, Spinner, Row, Col } from "react-bootstrap";

const MAX_VIDEO_SIZE_MB = 100;
const MAX_DOC_SIZE_MB = 10;

const ResourceForm = ({ unitIndex, lessonIndex, onSubmit, onCancel }) => {
  const [type, setType] = useState("video_url");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFileError("");
    if (!selectedFile) {
      setFile(null);
      return;
    }
    if (
      type === "video_file" &&
      selectedFile.size > MAX_VIDEO_SIZE_MB * 1024 * 1024
    ) {
      setFileError(`Video file size must be less than ${MAX_VIDEO_SIZE_MB}MB`);
      setFile(null);
      return;
    }
    if (
      type === "document" &&
      selectedFile.size > MAX_DOC_SIZE_MB * 1024 * 1024
    ) {
      setFileError(`Document size must be less than ${MAX_DOC_SIZE_MB}MB`);
      setFile(null);
      return;
    }
    setFile(selectedFile);
  };

  const handleResourceSubmit = async () => {
    if (
      !title ||
      (type === "video_url" && !url) ||
      (type !== "video_url" && !file)
    ) {
      alert("Please fill all required fields.");
      return;
    }
    if (fileError) {
      alert(fileError);
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", title);
      if (type === "video_url") {
        formData.append("url", url);
      } else {
        formData.append("file", file);
      }
      await onSubmit(unitIndex, lessonIndex, formData);
      setTitle("");
      setUrl("");
      setFile(null);
      setType("video_url");
    } catch (err) {
      alert("Failed to upload resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resource-form p-3 border rounded bg-light mb-3">
      <Row>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Resource Type</Form.Label>
            <Form.Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setFile(null);
                setFileError("");
              }}
            >
              <option value="video_url">Video URL</option>
              <option value="video_file">Video File (Max Size: 100mb)</option>
              <option value="document">Document (Max Size: 10mb)</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter resource title"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          {type === "video_url" ? (
            <Form.Group>
              <Form.Label>Video URL</Form.Label>
              <Form.Control
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter video URL"
                required
              />
            </Form.Group>
          ) : (
            <Form.Group>
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                onChange={handleFileChange}
                accept={
                  type === "video_file"
                    ? "video/*"
                    : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
                required
              />
              {fileError && (
                <div className="text-danger small mt-1">{fileError}</div>
              )}
            </Form.Group>
          )}
        </Col>
      </Row>
      <div className="d-flex gap-2 mt-3">
        <Button
          type="button"
          variant="primary"
          disabled={isSubmitting}
          onClick={handleResourceSubmit}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Uploading...
            </>
          ) : (
            "Add Resource"
          )}
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ResourceForm;