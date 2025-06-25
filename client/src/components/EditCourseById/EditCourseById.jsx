import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../utils/axios";
import {
  Button,
  Form,
  Spinner,
  Card,
  Badge,
  Alert,
  Row,
  Col,
  Container,
  Accordion,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { Modal } from "react-bootstrap";
import { FaPlus, FaTrash, FaFileAlt, FaFile, FaPlay, FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes } from "react-icons/fa";
import "./EditCourseById.css";
import "../Certificates/AddCertificate";
import { fileToBase64 } from "../../utils/fileBase64";




// --- Resource Modal ---
const ResourceModal = ({ resource, show, onHide, onComplete }) => {
  if (!resource) return null;
  const isVideo = resource.type === 'video_file' || resource.type === 'video_url';
  const isYouTubeUrl = (url) =>
    url.includes("youtube.com") || url.includes("youtu.be");
  const getYouTubeEmbedUrl = (url) => {
    if (url.includes("youtube.com")) {
      const urlObj = new URL(url);
      const videoId = urlObj.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (url.includes("youtu.be")) {
      const videoId = url.split("/").pop();
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };
  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl" // <-- Make modal extra large
      centered
      dialogClassName="resource-video-modal"
      backdrop={isVideo ? "static" : true}
      keyboard={!isVideo ? true : false}
      style={{ maxWidth: "98vw" }} // <-- Prevent overflow on very small screens
    >
      <Modal.Header closeButton>
        <Modal.Title>{resource.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body
        style={{
          padding: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 0,
          background: "#0001"
        }}
      >
        {resource.type === 'video_url' && (
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              aspectRatio: "16/9",
              margin: "auto"
            }}
          >
            <iframe
              src={isYouTubeUrl(resource.url) ? getYouTubeEmbedUrl(resource.url) : resource.url}
              title={resource.title}
              allowFullScreen
              style={{
                border: 0,
                width: "100%",
                height: "100%",
                minHeight: 320,
                background: "#000"
              }}
            ></iframe>
          </div>
        )}
        {resource.type === 'video_file' && resource.url && (
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              aspectRatio: "16/9",
              margin: "auto",
              display: "flex",
              justifyContent: "center"
            }}
          >
            <video
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "70vh",
                borderRadius: 8,
                background: "#000"
              }}
              controls
            >
              <source src={resource.url} type={resource.fileDetails?.contentType || "video/mp4"} />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {resource.type === 'document' && resource.url && !resource.url.startsWith("data:application/pdf") && (
          <a
            href={resource.url}
            download={resource.fileDetails?.originalName || resource.title}
            className="btn btn-primary m-4"
          >
            <FaFile className="me-2" />
            Download Document
          </a>
        )}
        {resource.type === 'document_url' && (
          <div className="text-center w-100 my-4">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              <FaFile className="me-2" />
              Open Document
            </a>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

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
    if (type === "video_file" && selectedFile.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      setFileError(`Video file size must be less than ${MAX_VIDEO_SIZE_MB}MB`);
      setFile(null);
      return;
    }
    if (type === "document" && selectedFile.size > MAX_DOC_SIZE_MB * 1024 * 1024) {
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
            <Form.Select value={type} onChange={(e) => { setType(e.target.value); setFile(null); setFileError(""); }}>
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

const TopRightAlert = ({ show, variant, message, onClose }) => {
  const iconMap = {
    success: <FaCheckCircle className="me-2" />,
    error: <FaTimesCircle className="me-2" />,
    info: <FaInfoCircle className="me-2" />,
  };
  const backgroundMap = {
    success: "#4CAF50",
    error: "#F44336",
    info: "#2196F3",
  };
  return (
    <ToastContainer
      position="top-end"
      className="p-3"
      style={{
        zIndex: 1060,
        position: "fixed", // <-- make it fixed
        top: 16,
        right: 16,
      }}
    >
      <Toast
        show={show}
        onClose={onClose}
        delay={4000}
        autohide
        style={{
          backgroundColor: backgroundMap[variant],
          border: "none",
          borderRadius: "12px",
          minWidth: "300px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <Toast.Body className="d-flex align-items-center justify-content-between text-white p-3">
          <div className="d-flex align-items-center">
            {iconMap[variant]}
            <span style={{ fontSize: "14px", fontWeight: "500" }}>{message}</span>
          </div>
          <FaTimes
            className="ms-3"
            style={{ cursor: "pointer", fontSize: "12px" }}
            onClick={onClose}
          />
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};


const EditCourseById = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [course, setCourse] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState({
    unit: null,
    lesson: null,
  });
  const [uploadingResource, setUploadingResource] = useState(false);
  
  const [selectedResource, setSelectedResource] = useState(null);
const [showResourceModal, setShowResourceModal] = useState(false);

const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${id}`);
        const courseData = response.data;
        setCourse({
          ...courseData,
          tags: courseData.tags || [],
          units: (courseData.units || []).map((unit) => ({
            ...unit,
            lessons: (unit.lessons || []).map((lesson) => ({
              ...lesson,
              resources: lesson.resources || [],
            })),
            assignment: unit.assignment || { assignmentSets: [] },
          })),
        });
      } catch (err) {
        setError("Error loading course");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // --- Basic Info Change ---
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]: name === "tags" ? value.split(",").map((t) => t.trim()) : value,
    }));
  };

  // --- Thumbnail Upload for Course ---
  const handleCourseThumbnailChange = async (file) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCourse((prev) => ({
      ...prev,
      thumbnail: base64,
    }));
  };

  // --- Unit Management ---
  const handleAddUnit = () => {
    setCourse((prev) => {
      const updated = { ...prev };
      // Avoid mutating state directly
      updated.units = [
        ...updated.units,
        {
          title: "",
          lessons: [],
          assignment: { assignmentSets: [] },
        },
      ];
      return updated;
    });
  };

  const handleRemoveUnit = (index) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleUnitChange = (unitIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex ? { ...unit, [field]: value } : unit
      );
      return updated;
    });
  };

  const handleResourceClick = (resource, unitIdx, lessonIdx, resourceIdx) => {
  const isPdf =
    resource.type === "document" &&
    resource.url &&
    resource.url.startsWith("data:application/pdf");
  if (isPdf) {
    // Convert base64 to Blob and open in new tab
    const base64 = resource.url.split(",")[1];
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, "_blank");
    // Set the document title after the PDF loads (may not work in all browsers)
    if (win) {
      win.onload = () => {
        win.document.title = resource.title || "Document";
      };
    }
    // Revoke the blob URL after a short delay to ensure the PDF loads
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } else if (resource.type === "document" && resource.url) {
    // For non-PDF documents, download
    const link = document.createElement("a");
    link.href = resource.url;
    link.download =
      resource.fileDetails?.originalName || resource.title || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else if (
    resource.type === "video_url" ||
    resource.type === "video_file"
  ) {
    setSelectedResource({ ...resource, unitIdx, lessonIdx, resourceIdx });
    setShowResourceModal(true);
  }
};

  // --- Lesson Management ---
  const handleAddLesson = (unitIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: [
                ...unit.lessons,
                {
                  title: "",
                  content: "",
                  videoUrl: "",
                  duration: 0,
                  resources: [],
                },
              ],
            }
          : unit
      );
      return updated;
    });
  };

  const handleRemoveLesson = (unitIndex, lessonIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.filter((_, i) => i !== lessonIndex),
            }
          : unit
      );
      return updated;
    });
  };

  const handleLessonChange = (unitIndex, lessonIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson, lidx) =>
                lidx === lessonIndex ? { ...lesson, [field]: value } : lesson
              ),
            }
          : unit
      );
      return updated;
    });
  };

  // --- Assignment Set Management ---
  const handleAddAssignmentSet = (unitIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: [
                  ...unit.assignment.assignmentSets,
                  {
                    setNumber: unit.assignment.assignmentSets.length + 1,
                    title: "",
                    description: "",
                    difficulty: "easy",
                    questions: [],
                  },
                ],
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleRemoveAssignmentSet = (unitIndex, setIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.filter(
                  (_, i) => i !== setIndex
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleAssignmentSetChange = (unitIndex, setIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex ? { ...set, [field]: value } : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  // --- Question Management ---
  const handleAddQuestion = (unitIndex, setIndex = null) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: [
                            ...set.questions,
                            {
                              questionText: "",
                              options: ["", "", "", ""],
                              correctAnswer: "0",
                              marks: 1,
                            },
                          ],
                        }
                      : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleRemoveQuestion = (unitIndex, questionIndex, setIndex = null) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: set.questions.filter(
                            (_, qidx) => qidx !== questionIndex
                          ),
                        }
                      : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleQuestionChange = (
    unitIndex,
    questionIndex,
    field,
    value,
    setIndex = null
  ) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: set.questions.map((q, qidx) =>
                            qidx === questionIndex
                              ? { ...q, [field]: value }
                              : q
                          ),
                        }
                      : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  // --- Resource Upload ---
  const handleResourceAdd = async (unitIndex, lessonIndex, formData) => {
    try {
      setUploadingResource(true);
      const response = await axios.post(
        `/api/courses/${id}/units/${unitIndex}/lessons/${lessonIndex}/resources`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setCourse((prev) => {
        const updated = { ...prev };
        updated.units = updated.units.map((unit, uidx) =>
          uidx === unitIndex
            ? {
                ...unit,
                lessons: unit.lessons.map((lesson, lidx) =>
                  lidx === lessonIndex
                    ? {
                        ...lesson,
                        resources: [
                          ...(lesson.resources || []),
                          response.data.resource,
                        ],
                      }
                    : lesson
                ),
              }
            : unit
        );
        return updated;
      });
      // Do NOT reset showResourceForm here!
      // setShowResourceForm({ unit: null, lesson: null }); // <-- REMOVE THIS LINE
      return response.data;
    } catch (err) {
      alert("Failed to upload resource");
      throw err;
    } finally {
      setUploadingResource(false);
    }
  };

  const handleRemoveResource = (unitIndex, lessonIndex, resourceIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, uidx) =>
        uidx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson, lidx) =>
                lidx === lessonIndex
                  ? {
                      ...lesson,
                      resources: lesson.resources.filter(
                        (_, ridx) => ridx !== resourceIndex
                      ),
                    }
                  : lesson
              ),
            }
          : unit
      );
      return updated;
    });
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    setAlertMessage("");
    try {
      // Calculate total duration
      const totalDuration = (course.units || []).reduce((total, unit) => {
        return (
          total +
          (unit.lessons || []).reduce(
            (sum, lesson) => sum + (parseInt(lesson.duration) || 0),
            0
          )
        );
      }, 0);

      // Prepare update data
      const updateData = {
        ...course,
        duration: totalDuration,
        units: (course.units || []).map((unit) => ({
          ...unit,
          lessons: (unit.lessons || []).map((lesson) => ({
            ...lesson,
            duration: parseInt(lesson.duration) || 0,
          })),
          assignment: {
            assignmentSets: (unit.assignment?.assignmentSets || []).map(
              (set, idx) => ({
                setNumber: idx + 1,
                title: set.title,
                description: set.description,
                difficulty: set.difficulty,
                questions: (set.questions || []).map((q) => ({
                  questionText: q.questionText,
                  options: (q.options || []).filter((opt) => opt.trim()),
                  correctAnswer: q.correctAnswer,
                  marks: parseInt(q.marks) || 1,
                })),
              })
            ),
          },
        })),
      };

      setLoading(true);
      setAlertMessage("Saving changes...");
      setShowSuccessAlert(true);

      await axios.put(`/api/courses/${id}`, updateData);

      setSuccess("Course updated successfully!");
      setAlertMessage("Course updated successfully!");
      setShowSuccessAlert(true);
      setTimeout(() => {
        navigate("/edit-courses");
      }, 1500);
    } catch (err) {
      const msg = err.response?.data?.message || "Error updating course";
      setError(msg);
      setAlertMessage(msg);
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Spinner animation="border" role="status" style={{ width: 60, height: 60 }}>
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}

  if (!course) {
    return (
      <div className="py-5">
        <Alert variant="danger">Course not found</Alert>
      </div>
    );
  }

  const hasCertificate = course?.certificate?.templateUrl;

  return (
    <Container className="py-4 mt-3">
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
      <h2 className="mb-4 mt-5 text-center">Edit Course</h2>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        name="title"
                        value={course.title}
                        onChange={handleBasicInfoChange}
                        required
                        placeholder="Course Title"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={course.category}
                        onChange={handleBasicInfoChange}
                      >
                        <option>Web Development</option>
                        <option>Data Science</option>
                        <option>AI/ML</option>
                        <option>Cloud</option>
                        <option>Cybersecurity</option>
                        <option>Finance</option>
                        <option>HR</option>
                        <option>Marketing</option>
                        <option>DevOps</option>
                        <option>Design</option>
                        <option>Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Difficulty</Form.Label>
                      <Form.Select
                        name="difficulty"
                        value={course.difficulty}
                        onChange={handleBasicInfoChange}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags (comma separated)</Form.Label>
                      <Form.Control
                        name="tags"
                        value={course.tags.join(",")}
                        onChange={(e) =>
                          setCourse((prev) => ({
                            ...prev,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim()),
                          }))
                        }
                        placeholder="e.g. javascript, react, backend"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={course.description}
                    onChange={handleBasicInfoChange}
                    required
                    rows={3}
                    placeholder="Course Description"
                  />
                </Form.Group>
                {/* Course Thumbnail */}
                <Form.Group className="mb-3">
                  <Form.Label>Course Thumbnail</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={async (e) =>
                      await handleCourseThumbnailChange(e.target.files[0])
                    }
                  />
                  {course.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={course.thumbnail}
                        alt="Course Thumbnail"
                        style={{ maxWidth: "200px", maxHeight: "120px" }}
                      />
                    </div>
                  )}
                </Form.Group>
                {hasCertificate ? (
                  <div className="mb-3">
                    <div className="mb-2">
                      <strong>Current Certificate:</strong>
                      <div>
                        <img
                          src={course.certificate.templateUrl}
                          alt="Certificate Template"
                          style={{
                            maxWidth: 300,
                            maxHeight: 120,
                            display: "block",
                            margin: "8px 0",
                          }}
                        />
                      </div>
                    </div>
                    <Button
                      variant="outline-info"
                      onClick={() =>
                        navigate(`/edit-courses/${id}/certificate-upload`)
                      }
                    >
                      Edit Certificate
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline-info"
                    className="mb-3"
                    onClick={() =>
                      navigate(`/edit-courses/${id}/certificate-upload`)
                    }
                  >
                    Add Certificate to the Course
                  </Button>
                )}
              </Card.Body>
            </Card>

            {/* Units and Lessons */}
            <h4 className="mb-3">Units</h4>
            <Accordion defaultActiveKey={course.units.length ? "0" : undefined}>
              {course.units.map((unit, unitIndex) => (
                <Accordion.Item eventKey={unitIndex.toString()} key={unitIndex}>
                  <Accordion.Header>
                    <span className="fw-semibold">
                      {unit.title || `Unit ${unitIndex + 1}`}
                    </span>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row className="align-items-center mb-3">
                      <Col md={10}>
                        <Form.Group>
                          <Form.Label>Unit Title</Form.Label>
                          <Form.Control
                            value={unit.title}
                            onChange={(e) =>
                              handleUnitChange(
                                unitIndex,
                                "title",
                                e.target.value
                              )
                            }
                            required
                            placeholder="Unit Title"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="text-end">
                        <Button
                          variant="outline-danger"
                          onClick={() => handleRemoveUnit(unitIndex)}
                          size="sm"
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                    <h5 className="mt-3 mb-2">Lessons</h5>
                    <Accordion alwaysOpen>
                      {unit.lessons.map((lesson, lessonIndex) => (
                        <Accordion.Item
                          eventKey={`lesson-${unitIndex}-${lessonIndex}`}
                          key={lessonIndex}
                        >
                          <Accordion.Header>
                            {lesson.title || `Lesson ${lessonIndex + 1}`}
                          </Accordion.Header>
                          <Accordion.Body>
                            <Row className="align-items-center mb-2">
                              <Col md={10}>
                                <Form.Group>
                                  <Form.Label>Lesson Title</Form.Label>
                                  <Form.Control
                                    value={lesson.title}
                                    onChange={(e) =>
                                      handleLessonChange(
                                        unitIndex,
                                        lessonIndex,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    required
                                    placeholder="Lesson Title"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={2} className="text-end">
                                <Button
                                  variant="outline-danger"
                                  onClick={() =>
                                    handleRemoveLesson(unitIndex, lessonIndex)
                                  }
                                  size="sm"
                                >
                                  <FaTrash />
                                </Button>
                              </Col>
                            </Row>
                            <Form.Group className="mb-2">
                              <Form.Label>Content</Form.Label>
                              <Form.Control
                                as="textarea"
                                value={lesson.content}
                                onChange={(e) =>
                                  handleLessonChange(
                                    unitIndex,
                                    lessonIndex,
                                    "content",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                placeholder="Lesson Content"
                              />
                            </Form.Group>

                            <Form.Group className="mb-2">
                              <Form.Label>Duration (minutes)</Form.Label>
                              <Form.Control
                                type="number"
                                value={lesson.duration}
                                onChange={(e) =>
                                  handleLessonChange(
                                    unitIndex,
                                    lessonIndex,
                                    "duration",
                                    e.target.value
                                  )
                                }
                                min={0}
                                placeholder="Duration"
                              />
                            </Form.Group>
                            {/* Resources Section */}
                            <div className="resources-section">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6>Resources</h6>
                                {showResourceForm.unit !== unitIndex ||
                                showResourceForm.lesson !== lessonIndex ? (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() =>
                                      setShowResourceForm({
                                        unit: unitIndex,
                                        lesson: lessonIndex,
                                      })
                                    }
                                    disabled={uploadingResource}
                                  >
                                    <FaPlus className="me-1" /> Add Resource
                                  </Button>
                                ) : null}
                              </div>
                              {(lesson.resources || []).length > 0 ? (
                                <div className="resources-list">
                                  {lesson.resources.map((resource, resourceIndex) => (
  <div
    key={resourceIndex}
    className="resource-item d-flex align-items-center mb-2"
  >
    <Badge
      bg={
        resource.type === "video_url"
          ? "primary"
          : resource.type === "video_file"
          ? "success"
          : "secondary"
      }
    >
      {resource.type === "video_url"
        ? "Video URL"
        : resource.type === "video_file"
        ? "Video File"
        : "Document"}
    </Badge>
    <span className="resource-title ms-2">
      {resource.title || ""}
    </span>
    <Button
      variant="outline-danger"
      size="sm"
      className="btn-remove ms-2"
      onClick={() =>
        handleRemoveResource(
          unitIndex,
          lessonIndex,
          resourceIndex
        )
      }
    >
      <FaTrash />
    </Button>
    {/* Add this button for resource actions */}
    <Button
      key={resourceIndex}
      variant="outline-secondary"
      size="sm"
      className="ms-2"
      onClick={() =>
        handleResourceClick(resource, unitIndex, lessonIndex, resourceIndex)
      }
    >
      {(resource.type === 'video_url' || resource.type === 'video_file') && <FaPlay className="me-1" />}
      {(resource.type === 'document' || resource.type === 'document_url') && <FaFile className="me-1" />}
      {resource.title}
    </Button>
  </div>
))}
                                </div>
                              ) : (
                                <div className="resources-empty">
                                  <FaFileAlt className="mb-2" size={24} />
                                  <p className="mb-0">No resources added yet</p>
                                </div>
                              )}
                              {showResourceForm.unit === unitIndex &&
                                showResourceForm.lesson === lessonIndex && (
                                  <ResourceForm
                                    unitIndex={unitIndex}
                                    lessonIndex={lessonIndex}
                                    onSubmit={handleResourceAdd}
                                    onCancel={() =>
                                      setShowResourceForm({
                                        unit: null,
                                        lesson: null,
                                      })
                                    }
                                  />
                                )}
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                    <div className="my-2 text-end">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleAddLesson(unitIndex)}
                      >
                        <FaPlus className="me-1" /> Add Lesson
                      </Button>
                    </div>
                    {/* Assignment Sets */}
                    <div className="mt-4">
                      <h5 className="mb-2">Assignment Sets</h5>
                      <Accordion alwaysOpen>
                        {unit.assignment.assignmentSets.map((set, setIndex) => (
                          <Accordion.Item
                            eventKey={`set-${unitIndex}-${setIndex}`}
                            key={setIndex}
                          >
                            <Accordion.Header>
                              {set.title || `Set ${setIndex + 1}`}
                            </Accordion.Header>
                            <Accordion.Body>
                              <Row className="align-items-center mb-2">
                                <Col md={10}>
                                  <Form.Group>
                                    <Form.Label>Set Title</Form.Label>
                                    <Form.Control
                                      value={set.title}
                                      onChange={(e) =>
                                        handleAssignmentSetChange(
                                          unitIndex,
                                          setIndex,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      required
                                      placeholder="Assignment Set Title"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={2} className="text-end">
                                  <Button
                                    variant="outline-danger"
                                    onClick={() =>
                                      handleRemoveAssignmentSet(
                                        unitIndex,
                                        setIndex
                                      )
                                    }
                                    size="sm"
                                  >
                                    <FaTrash />
                                  </Button>
                                </Col>
                              </Row>
                              <Form.Group className="mb-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  value={set.description}
                                  onChange={(e) =>
                                    handleAssignmentSetChange(
                                      unitIndex,
                                      setIndex,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                  placeholder="Assignment Set Description"
                                />
                              </Form.Group>
                              <Form.Group className="mb-2">
                                <Form.Label>Difficulty</Form.Label>
                                <Form.Select
                                  value={set.difficulty}
                                  onChange={(e) =>
                                    handleAssignmentSetChange(
                                      unitIndex,
                                      setIndex,
                                      "difficulty",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </Form.Select>
                              </Form.Group>
                              <h6 className="mt-3 mb-2">Questions</h6>
                              <Accordion alwaysOpen>
                                {set.questions.map((q, qIdx) => (
                                  <Accordion.Item
                                    eventKey={`q-${unitIndex}-${setIndex}-${qIdx}`}
                                    key={qIdx}
                                  >
                                    <Accordion.Header>
                                      {q.questionText
                                        ? q.questionText.slice(0, 30) +
                                          (q.questionText.length > 30
                                            ? "..."
                                            : "")
                                        : `Question ${qIdx + 1}`}
                                    </Accordion.Header>
                                    <Accordion.Body>
                                      <Form.Group className="mb-2">
                                        <Form.Label>Question Text</Form.Label>
                                        <Form.Control
                                          value={q.questionText}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              unitIndex,
                                              qIdx,
                                              "questionText",
                                              e.target.value,
                                              setIndex
                                            )
                                          }
                                          required
                                          placeholder="Question"
                                        />
                                      </Form.Group>
                                      <Form.Label>Options</Form.Label>
                                      {q.options.map((opt, optIdx) => (
                                        <Form.Group
                                          className="mb-2"
                                          key={optIdx}
                                        >
                                          <Form.Control
                                            value={opt}
                                            onChange={(e) => {
                                              const newOptions = [...q.options];
                                              newOptions[optIdx] =
                                                e.target.value;
                                              handleQuestionChange(
                                                unitIndex,
                                                qIdx,
                                                "options",
                                                newOptions,
                                                setIndex
                                              );
                                            }}
                                            placeholder={`Option ${optIdx + 1}`}
                                            required
                                          />
                                        </Form.Group>
                                      ))}
                                      <Form.Group className="mb-2">
                                        <Form.Label>
                                          Correct Answer (option number)
                                        </Form.Label>
                                        <Form.Select
                                          value={q.correctAnswer}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              unitIndex,
                                              qIdx,
                                              "correctAnswer",
                                              e.target.value,
                                              setIndex
                                            )
                                          }
                                        >
                                          {q.options.map((_, idx) => (
                                            <option key={idx} value={idx}>
                                              {`Option ${idx + 1}`}
                                            </option>
                                          ))}
                                        </Form.Select>
                                      </Form.Group>
                                      <Form.Group className="mb-2">
                                        <Form.Label>Marks</Form.Label>
                                        <Form.Control
                                          type="number"
                                          value={q.marks}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              unitIndex,
                                              qIdx,
                                              "marks",
                                              e.target.value,
                                              setIndex
                                            )
                                          }
                                          min={1}
                                          required
                                          placeholder="Marks"
                                        />
                                      </Form.Group>
                                      <div className="text-end">
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveQuestion(
                                              unitIndex,
                                              qIdx,
                                              setIndex
                                            )
                                          }
                                        >
                                          <FaTrash /> Remove Question
                                        </Button>
                                      </div>
                                    </Accordion.Body>
                                  </Accordion.Item>
                                ))}
                              </Accordion>
                              <div className="my-2 text-end">
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() =>
                                    handleAddQuestion(unitIndex, setIndex)
                                  }
                                >
                                  <FaPlus className="me-1" /> Add Question
                                </Button>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                      <div className="my-2 text-end">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleAddAssignmentSet(unitIndex)}
                        >
                          <FaPlus className="me-1" /> Add Assignment Set
                        </Button>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
            <div className="my-3 text-end">
              <Button variant="outline-success" onClick={handleAddUnit}>
                <FaPlus className="me-1" /> Add Unit
              </Button>
            </div>
            <div className="mt-4 text-center">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                size="lg"
              >
                {loading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Saving changes...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
      <ResourceModal
  resource={selectedResource}
  show={showResourceModal}
  onHide={() => {
    setShowResourceModal(false);
    setSelectedResource(null);
  }}
/>
    </Container>
  );
};

export default EditCourseById;
