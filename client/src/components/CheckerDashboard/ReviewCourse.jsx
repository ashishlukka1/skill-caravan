import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  Container,
  Button,
  Spinner,
  Alert,
  Form,
  Table,
  Badge,
  Accordion,
  Modal,
} from "react-bootstrap";
import { FaPlay, FaFile } from "react-icons/fa";

const displayValue = (val) => {
  if (val === undefined || val === null || val === "")
    return <span className="text-muted">N/A</span>;
  if (Array.isArray(val))
    return val.length ? val.join(", ") : <span className="text-muted">[]</span>;
  if (typeof val === "object") return JSON.stringify(val, null, 2);
  return val.toString();
};

// Resource Modal
const ResourceModal = ({ resource, show, onHide, onComplete }) => {
  if (!resource) return null;
  const isVideo =
    resource.type === "video_file" || resource.type === "video_url";
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
          background: "#0001",
        }}
      >
        {resource.type === "video_url" && (
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              aspectRatio: "16/9",
              margin: "auto",
            }}
          >
            <iframe
              src={
                isYouTubeUrl(resource.url)
                  ? getYouTubeEmbedUrl(resource.url)
                  : resource.url
              }
              title={resource.title}
              allowFullScreen
              style={{
                border: 0,
                width: "100%",
                height: "100%",
                minHeight: 320,
                background: "#000",
              }}
            ></iframe>
          </div>
        )}
        {resource.type === "video_file" && resource.url && (
          <div
            style={{
              width: "100%",
              maxWidth: "900px",
              aspectRatio: "16/9",
              margin: "auto",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <video
              style={{
                width: "100%",
                height: "100%",
                maxHeight: "70vh",
                borderRadius: 8,
                background: "#000",
              }}
              controls
            >
              <source
                src={resource.url}
                type={resource.fileDetails?.contentType || "video/mp4"}
              />
              Your browser does not support the video tag.
            </video>
          </div>
        )}
        {resource.type === "document" &&
          resource.url &&
          !resource.url.startsWith("data:application/pdf") && (
            <a
              href={resource.url}
              download={resource.fileDetails?.originalName || resource.title}
              className="btn btn-primary m-4"
            >
              <FaFile className="me-2" />
              Download Document
            </a>
          )}
        {resource.type === "document_url" && (
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

const ReviewCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alert, setAlert] = useState({
    show: false,
    variant: "success",
    message: "",
  });
  const [resourceModal, setResourceModal] = useState({
    show: false,
    resource: null,
  });
  const [openAssignmentSets, setOpenAssignmentSets] = useState({}); // {unitIdx: setIdx}

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/api/courses/${id}`);
        setCourse(res.data);
      } catch (err) {
        setAlert({
          show: true,
          variant: "danger",
          message: "Failed to fetch course.",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/checker/${id}/approve`, { feedback });
      setAlert({
        show: true,
        variant: "success",
        message: "Course approved and published!",
      });
      setTimeout(() => navigate("/checker-dashboard"), 1200);
    } catch (err) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Failed to approve course.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await axios.post(`/api/checker/${id}/reject`, { feedback });
      setAlert({ show: true, variant: "warning", message: "Course rejected." });
      setTimeout(() => navigate("/checker-dashboard"), 1200);
    } catch (err) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Failed to reject course.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Resource rendering like EditCourseById
  const renderResources = (resources) => {
    if (!resources || !resources.length)
      return <span className="text-muted">No resources</span>;
    return (
      <ul>
        {resources.map((res, idx) => {
          // PDF base64
          if (
            res.type === "document" &&
            res.url &&
            res.url.startsWith("data:application/pdf")
          ) {
            return (
              <li key={idx} className="mb-1">
                <strong>{res.title || "Untitled"}</strong> (PDF)
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="ms-2"
                  onClick={() => {
                    // Convert base64 to Blob and open in new tab
                    const base64 = res.url.split(",")[1];
                    const byteString = atob(base64);
                    const ab = new ArrayBuffer(byteString.length);
                    const ia = new Uint8Array(ab);
                    for (let i = 0; i < byteString.length; i++) {
                      ia[i] = byteString.charCodeAt(i);
                    }
                    const blob = new Blob([ab], { type: "application/pdf" });
                    const blobUrl = URL.createObjectURL(blob);
                    window.open(blobUrl, "_blank");
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
                  }}
                >
                  <FaFile className="me-1" />
                  View PDF
                </Button>
              </li>
            );
          }
          // Other base64 docs (download)
          if (
            res.type === "document" &&
            res.url &&
            res.url.startsWith("data:")
          ) {
            return (
              <li key={idx} className="mb-1">
                <strong>{res.title || "Untitled"}</strong> (Document)
                <a
                  href={res.url}
                  download={
                    res.fileDetails?.originalName || res.title || "document"
                  }
                  className="btn btn-outline-primary btn-sm ms-2"
                >
                  <FaFile className="me-1" />
                  Download
                </a>
              </li>
            );
          }
          // YouTube/video_url/video_file
          if (
            (res.type === "video_url" &&
              (res.url.includes("youtube.com") ||
                res.url.includes("youtu.be"))) ||
            res.type === "video_file"
          ) {
            return (
              <li key={idx} className="mb-1">
                <strong>{res.title || "Untitled"}</strong> (Video)
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="ms-2"
                  onClick={() =>
                    setResourceModal({ show: true, resource: res })
                  }
                >
                  <FaPlay className="me-1" />
                  View
                </Button>
              </li>
            );
          }
          // video_url (not YouTube)
          if (res.type === "video_url") {
            return (
              <li key={idx} className="mb-1">
                <strong>{res.title || "Untitled"}</strong> (Video)
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm ms-2"
                >
                  <FaPlay className="me-1" />
                  View
                </a>
              </li>
            );
          }
          // document_url (external)
          if (res.type === "document_url") {
            return (
              <li key={idx} className="mb-1">
                <strong>{res.title || "Untitled"}</strong> (Document)
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-primary btn-sm ms-2"
                >
                  <FaFile className="me-1" />
                  Open
                </a>
              </li>
            );
          }
          // fallback
          return (
            <li key={idx} className="mb-1">
              <strong>{res.title || "Untitled"}</strong>
            </li>
          );
        })}
      </ul>
    );
  };
  // When an assignment set is opened, expand all its questions
  const handleAssignmentSetToggle = (unitIdx, setIdx) => {
    setOpenAssignmentSets((prev) => ({
      ...prev,
      [`${unitIdx}-${setIdx}`]: prev[`${unitIdx}-${setIdx}`] ? false : true,
    }));
  };

  return (
    <Container className="py-5 mt-4">
      <h2 className="mb-4 mt-3">Review Course</h2>
      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      {loading ? (
        <div className="text-center py-5 min-vh-100">
          <Spinner animation="border" />
        </div>
      ) : course ? (
        <>
          {/* Course Details Table */}
          <Table bordered>
            <tbody>
              <tr>
                <th>Title</th>
                <td>{displayValue(course.title)}</td>
              </tr>
              <tr>
                <th>Description</th>
                <td>{displayValue(course.description)}</td>
              </tr>
              <tr>
                <th>Category</th>
                <td>{displayValue(course.category)}</td>
              </tr>
              <tr>
                <th>Difficulty</th>
                <td>{displayValue(course.difficulty)}</td>
              </tr>
              <tr>
                <th>Instructor</th>
                <td>
                  {course.instructor?.name ||
                    course.instructor?.email ||
                    displayValue(course.instructor)}
                </td>
              </tr>
              <tr>
                <th>Tags</th>
                <td>{displayValue(course.tags)}</td>
              </tr>
              <tr>
                <th>Created At</th>
                <td>
                  {course.createdAt ? (
                    new Date(course.createdAt).toLocaleString()
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
              <tr>
                <th>Status</th>
                <td>
                  <Badge
                    bg={
                      course.approvalStatus === "approved"
                        ? "success"
                        : course.approvalStatus === "pending"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {course.approvalStatus}
                  </Badge>
                </td>
              </tr>
              <tr>
                <th>Published</th>
                <td>
                  {course.published ? (
                    <Badge bg="success">Yes</Badge>
                  ) : (
                    <Badge bg="secondary">No</Badge>
                  )}
                </td>
              </tr>
            </tbody>
          </Table>

          {/* Thumbnail and Certificate */}
          <div className="d-flex flex-wrap gap-4 mb-4">
            <div>
              <h6>Thumbnail</h6>
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt="thumbnail"
                  style={{
                    maxWidth: 180,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
            <div>
              <h6>Certificate Template</h6>
              {course.certificate && course.certificate.templateUrl ? (
                <img
                  src={course.certificate.templateUrl}
                  alt="certificate"
                  style={{
                    maxWidth: 220,
                    borderRadius: 8,
                    border: "1px solid #ccc",
                  }}
                />
              ) : (
                <span className="text-muted">N/A</span>
              )}
            </div>
          </div>

          {/* Units Accordion */}
          <h5 className="mb-3">Units</h5>
          {Array.isArray(course.units) && course.units.length > 0 ? (
            <Accordion defaultActiveKey="0" alwaysOpen>
              {course.units.map((unit, unitIdx) => (
                <Accordion.Item eventKey={unitIdx.toString()} key={unitIdx}>
                  <Accordion.Header>
                    Unit {unitIdx + 1} Title : {unit.title || "Untitled"}
                  </Accordion.Header>
                  <Accordion.Body>
                    {/* Lessons */}
                    <h6>Lessons</h6>
                    {unit.lessons && unit.lessons.length > 0 ? (
                      <Accordion>
                        {unit.lessons.map((lesson, lessonIdx) => (
                          <Accordion.Item
                            eventKey={lessonIdx.toString()}
                            key={lessonIdx}
                          >
                            <Accordion.Header>
                              Lesson {lessonIdx + 1} Title :{" "}
                              {lesson.title || "Untitled"}
                            </Accordion.Header>
                            <Accordion.Body>
                              <div>
                                <strong>Description : </strong>
                                <div>
                                  {lesson.content || (
                                    <span className="text-muted">
                                      No content
                                    </span>
                                  )}
                                </div>
                                {lesson.videoUrl && (
                                  <div className="mt-2">
                                    <strong>Video:</strong>
                                    <div>
                                      <a
                                        href={lesson.videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {lesson.videoUrl}
                                      </a>
                                    </div>
                                  </div>
                                )}
                                <div className="mt-2">
                                  <strong>Duration:</strong>{" "}
                                  {lesson.duration ? (
                                    `${lesson.duration} min`
                                  ) : (
                                    <span className="text-muted">N/A</span>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <strong>Resources:</strong>
                                  {renderResources(lesson.resources)}
                                </div>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="text-muted mb-2">No lessons</div>
                    )}

                    {/* Assignments */}
                    <div className="mt-3">
                      <h6>Assignments</h6>
                      {unit.assignment &&
                      unit.assignment.assignmentSets &&
                      unit.assignment.assignmentSets.length > 0 ? (
                        <Accordion alwaysOpen>
                          {unit.assignment.assignmentSets.map((set, setIdx) => (
                            <Accordion.Item
                              eventKey={setIdx.toString()}
                              key={setIdx}
                              onClick={() =>
                                handleAssignmentSetToggle(unitIdx, setIdx)
                              }
                              active={
                                !!openAssignmentSets[`${unitIdx}-${setIdx}`]
                              }
                            >
                              <Accordion.Header>
                                Set {set.setNumber || setIdx + 1} Title :{" "}
                                {set.title || "Untitled"}
                              </Accordion.Header>
                              <Accordion.Body>
                                <div>
                                  <strong>Description:</strong>{" "}
                                  {set.description || (
                                    <span className="text-muted">
                                      No description
                                    </span>
                                  )}
                                  <br />
                                  <strong>Difficulty:</strong>{" "}
                                  {set.difficulty || (
                                    <span className="text-muted">N/A</span>
                                  )}
                                </div>
                                <div className="mt-3">
                                  <h6>Questions</h6>
                                  {set.questions && set.questions.length > 0 ? (
                                    <Accordion
                                      activeKey={
                                        openAssignmentSets[
                                          `${unitIdx}-${setIdx}`
                                        ]
                                          ? set.questions.map((_, qIdx) =>
                                              qIdx.toString()
                                            )
                                          : []
                                      }
                                      alwaysOpen
                                    >
                                      {set.questions.map((q, qIdx) => (
                                        <Accordion.Item
                                          eventKey={qIdx.toString()}
                                          key={qIdx}
                                        >
                                          <Accordion.Header>
                                            Question {qIdx + 1}
                                          </Accordion.Header>
                                          <Accordion.Body>
                                            <div>
                                              <strong>Question:</strong>{" "}
                                              {q.questionText || (
                                                <span className="text-muted">
                                                  No question
                                                </span>
                                              )}
                                            </div>
                                            <div className="mt-2">
                                              <strong>Options:</strong>
                                              <ul>
                                                {q.options &&
                                                q.options.length > 0 ? (
                                                  q.options.map(
                                                    (opt, optIdx) => (
                                                      <li key={optIdx}>
                                                        Option {optIdx + 1}:{" "}
                                                        {opt}
                                                        {q.correctAnswer ===
                                                          opt && (
                                                          <Badge
                                                            bg="success"
                                                            className="ms-2"
                                                          >
                                                            Correct
                                                          </Badge>
                                                        )}
                                                      </li>
                                                    )
                                                  )
                                                ) : (
                                                  <li className="text-muted">
                                                    No options
                                                  </li>
                                                )}
                                              </ul>
                                            </div>
                                            <div>
                                              <strong>Correct Option:</strong>{" "}
                                              {q.correctAnswer || (
                                                <span className="text-muted">
                                                  N/A
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              <strong>Marks:</strong>{" "}
                                              {q.marks || 1}
                                            </div>
                                          </Accordion.Body>
                                        </Accordion.Item>
                                      ))}
                                    </Accordion>
                                  ) : (
                                    <div className="text-muted">
                                      No questions
                                    </div>
                                  )}
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="text-muted">No assignments</div>
                      )}
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
          ) : (
            <p className="text-muted">No units found.</p>
          )}

          {/* Feedback and Actions */}
          <Form.Group className="mt-4">
            <Form.Label>Feedback (optional)</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Add feedback for the Admin (optional)"
            />
          </Form.Group>
          <div className="mt-4">
            <Button
              variant="success"
              disabled={actionLoading}
              className="me-2"
              onClick={handleApprove}
            >
              {actionLoading ? <Spinner size="sm" /> : "Approve & Publish"}
            </Button>
            <Button
              variant="danger"
              disabled={actionLoading}
              onClick={handleReject}
            >
              {actionLoading ? <Spinner size="sm" /> : "Reject"}
            </Button>
          </div>
          <ResourceModal
            resource={resourceModal.resource}
            show={resourceModal.show}
            onHide={() => setResourceModal({ show: false, resource: null })}
          />
        </>
      ) : (
        <Alert variant="danger">Course not found.</Alert>
      )}
    </Container>
  );
};

export default ReviewCourse;
