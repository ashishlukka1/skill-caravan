import React, { useState, useEffect, useContext } from "react";
import {
  Container,
  Row,
  Col,
  Badge,
  Spinner,
  Alert,
  Button,
  ProgressBar,
  Card,
  Accordion,
} from "react-bootstrap";
import {
  FaLock,
  FaCheckCircle,
  FaChevronRight,
  FaPlay,
  FaFile,
  FaClock,
} from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";
import Loading from "../../../utils/Loading";
import TopRightAlert from "../../../utils/TopRightAlert";
import ResourceModal from "../../../utils/ResourceModal";
import {
  fetchCourseAndProgress,
  handleEnroll as enrollHandler,
  handleLessonComplete as lessonCompleteHandler,
  handleAssignmentStart as assignmentStartHandler,
} from "./CourseDetail.handlers";
import "./CourseDetail.css";
import "../../Courses/Courses.css";

const CourseDetail = () => {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  // Alerts
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("info");
  const [alertMsg, setAlertMsg] = useState("");

  const [markingLesson, setMarkingLesson] = useState({});
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchCourseAndProgress(
      id,
      user,
      setCourse,
      setProgress,
      setIsEnrolled,
      setError,
      setLoading
    );
    // eslint-disable-next-line
  }, [id, user]);

  // --- Certificate Notification Logic ---
  const certificate =
    progress?.certificate && progress.certificate.issued
      ? progress.certificate
      : null;
  useEffect(() => {
    if (
      progress &&
      progress.status === "completed" &&
      certificate &&
      certificate.certificateUrl
    ) {
      setAlertType("success");
      setAlertMsg("Congratulations! Your certificate has been issued.");
      setShowAlert(true);
      const timer = setTimeout(() => setShowAlert(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [progress, certificate]);

  const handleEnroll = () =>
    enrollHandler(
      id,
      user,
      navigate,
      setEnrolling,
      setProgress,
      setIsEnrolled,
      setCourse,
      setAlertType,
      setAlertMsg,
      setShowAlert
    );

  const handleLessonComplete = (unitIdx, lessonIdx) =>
    lessonCompleteHandler(
      id,
      unitIdx,
      lessonIdx,
      isEnrolled,
      setMarkingLesson,
      setProgress,
      setAlertType,
      setAlertMsg,
      setShowAlert
    );

  const handleAssignmentStart = (unitIdx) =>
    assignmentStartHandler(
      id,
      course,
      unitIdx,
      isEnrolled,
      setAlertType,
      setAlertMsg,
      setShowAlert,
      setProgress
    );

  const handleResourceComplete = async (unitIdx, lessonIdx, resourceId) => {
    if (!isEnrolled) return;
    try {
      const response = await axios.post(
        `/api/progress/${id}/unit/${unitIdx}/lesson/${lessonIdx}`,
        {
          resourceId,
          resourceProgress: {
            completed: true,
            watchTime: 0,
          },
        }
      );
      setProgress(response.data);
      setAlertType("success");
      setAlertMsg("Resource marked as complete!");
      setShowAlert(true);
    } catch (err) {
      setAlertType("error");
      setAlertMsg("Failed to update resource progress");
      setShowAlert(true);
    }
  };

  // --- Stats helpers (local, or move to a separate file if desired) ---
  const areAllLessonsCompleted = (unitIdx) => {
    const unitProgress = progress?.unitsProgress?.[unitIdx];
    const unit = course?.units?.[unitIdx];
    if (!unit || !unitProgress) return false;
    return (
      unitProgress.lessonsCompleted?.length === unit.lessons.length &&
      unitProgress.lessonsCompleted.every((l) => l.completed)
    );
  };

  const isAssignmentPerfect = (unit, unitProgress) => {
    if (!unit || !unitProgress?.assignment) return false;
    let assignedSet;
    if (unitProgress.assignment.assignedSetNumber) {
      assignedSet = unit.assignment.assignmentSets.find(
        (set) => set.setNumber === unitProgress.assignment.assignedSetNumber
      );
    } else if (unit.assignment.assignmentSets.length === 1) {
      assignedSet = unit.assignment.assignmentSets[0];
    }
    const totalScore = assignedSet
      ? assignedSet.questions.reduce((acc, q) => acc + q.marks, 0)
      : 0;
    return (
      unitProgress.assignment.status === "submitted" &&
      unitProgress.assignment.score === totalScore &&
      totalScore > 0
    );
  };

  const isAssignmentSubmitted = (unitProgress) =>
    unitProgress?.assignment?.status === "submitted";

  const getAssignmentButtonText = (unitIdx, unitProgress, unit) => {
    const isUnitUnlocked =
      unitIdx === 0 || progress?.unitsProgress?.[unitIdx - 1]?.completed;
    if (!isUnitUnlocked) return "Complete previous unit first";
    if (!areAllLessonsCompleted(unitIdx)) return "Complete all lessons first";
    if (isAssignmentPerfect(unit, unitProgress)) return "Assessment Complete";
    if (isAssignmentSubmitted(unitProgress)) return "Review Assessment";
    if (!unitProgress?.assignment?.assignedSetNumber) return "Start Assessment";
    return "Continue Assignment";
  };

  // --- RENDER LOGIC ---

  if (loading) {
    return <Loading message="Loading course details..." />;
  }

  if (error || !course) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error || "Course not found"}</Alert>
      </Container>
    );
  }

  // Only allow enrolled users to see content
  if (!isEnrolled) {
    return (
      <Container className="mt-4 mb-4 min-vh-100 d-flex justify-content-center align-items-center">
        <Card className="course-preview-card p-2">
          <Card.Body className="text-center">
            <FaLock className="preview-lock-icon mb-3" size={40} />
            <h3>Course Content Locked</h3>
            <p className="text-muted">
              Enroll in this course to access all lessons and assessments.
            </p>
            <Button
              variant="primary"
              size="md"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? "Enrolling..." : "Enroll Now"}
            </Button>
          </Card.Body>
        </Card>
        <TopRightAlert
          show={showAlert}
          variant={alertType}
          message={alertMsg}
          onClose={() => setShowAlert(false)}
        />
      </Container>
    );
  }

  // Defensive: check units array
  const hasUnits = Array.isArray(course?.units) && course.units.length > 0;
  const unit = hasUnits ? course.units[selectedUnit] : null;
  const unitProgress = progress?.unitsProgress?.[selectedUnit];
  const isUnitUnlocked =
    selectedUnit === 0 ||
    progress?.unitsProgress?.[selectedUnit - 1]?.completed;

  const renderAssignment = (unit, unitIdx) => {
    if (!unit.assignment?.assignmentSets?.length) return null;
    const unitProgress = progress?.unitsProgress?.[unitIdx];
    const isUnitUnlocked =
      unitIdx === 0 || progress?.unitsProgress?.[unitIdx - 1]?.completed;
    const assignedSetNumber = unitProgress?.assignment?.assignedSetNumber;
    let assignedSet;
    if (assignedSetNumber) {
      assignedSet = unit.assignment.assignmentSets.find(
        (set) => set.setNumber === assignedSetNumber
      );
    } else if (unit.assignment.assignmentSets.length === 1) {
      assignedSet = unit.assignment.assignmentSets[0];
    }
    const assignmentPerfect = isAssignmentPerfect(unit, unitProgress);
    const assignmentSubmitted = isAssignmentSubmitted(unitProgress);

    return (
      <div className="assignment-section mt-4">
        <h6 className="section-title">Assessment</h6>
        <Card className="assignment-card1">
          <Card.Body>
            {assignedSet ? (
              <>
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h5 className="assignment-title">{assignedSet.title}</h5>
                    <p className="assignment-description mb-2">
                      {assignedSet.description}
                    </p>
                    <Badge bg="info" className="me-2">
                      Set {assignedSet.setNumber}
                    </Badge>
                    <Badge bg="secondary">
                      Difficulty: {assignedSet.difficulty}
                    </Badge>
                  </div>
                  {assignmentSubmitted && (
                    <Badge bg={assignmentPerfect ? "success" : "warning"}>
                      Score: {unitProgress.assignment.score}
                    </Badge>
                  )}
                </div>
                <div className="text-end">
                  {assignmentPerfect ? (
                    <Badge bg="success" className="py-2 px-3 fs-6">
                      Assessment Complete
                    </Badge>
                  ) : (
                    <Button
                      variant={
                        assignmentSubmitted ? "outline-success" : "primary"
                      }
                      onClick={() => {
                        navigate(`/courses/${id}/assignment/${unitIdx}`);
                      }}
                      disabled={
                        !isUnitUnlocked || !areAllLessonsCompleted(unitIdx)
                      }
                    >
                      {getAssignmentButtonText(unitIdx, unitProgress, unit)}
                    </Button>
                  )}
                </div>
              </>
            ) : assignmentPerfect ? (
              <div className="text-center py-3">
                <Badge bg="success">Assessment Complete</Badge>
              </div>
            ) : isUnitUnlocked && areAllLessonsCompleted(unitIdx) ? (
              <>
                <p className="mb-3">Ready to start your assessment?</p>
                <Button
                  variant="primary"
                  onClick={() => handleAssignmentStart(unitIdx)}
                >
                  Start Assessment
                </Button>
              </>
            ) : (
              <>
                <FaLock className="mb-2" size={24} />
                <p className="mb-0">
                  Complete all lessons to unlock the assessment.
                </p>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    );
  };

  return (
    <div className="course-detail-page min-vh-100">
      {/* --- Top-Right Alerts --- */}
      <TopRightAlert
        show={showAlert}
        variant={alertType}
        message={alertMsg}
        onClose={() => setShowAlert(false)}
      />

      {/* --- Course Header --- */}
      <div className="course-header">
        <Container>
          <Row className="align-items-center">
            <Col md={8} xs={12}>
              <h1>{course.title}</h1>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <Badge bg="primary" className="me-2">
                  {course.category}
                </Badge>
                <Badge bg="secondary" className="me-2">
                  {course.difficulty}
                </Badge>
                <span className="me-3">
                  <FaClock className="me-1" /> {course.duration} minutes
                </span>
              </div>
              <div className="mt-3">
                <ProgressBar
                  now={progress?.progress || 0}
                  label={`${progress?.progress || 0}% Complete`}
                  variant="info"
                />
              </div>
            </Col>
            <Col md={4} xs={12} className="text-end mt-3 mt-md-0">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="course-thumbnail1"
                  style={{
                    maxWidth: "100%",
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                />
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {/* --- Main Content --- */}
      {hasUnits && unit ? (
        <Container className="mt-4">
          <Row>
            <Col md={4} lg={3} xs={12} className="mb-4 mb-md-0">
              <div className="units-sidebar">
                <h5 className="mb-3">Course Units</h5>
                <ul className="units-list">
                  {course.units.map((u, idx) => {
                    const isUnlocked =
                      idx === 0 ||
                      progress?.unitsProgress?.[idx - 1]?.completed;
                    const isCompleted =
                      progress?.unitsProgress?.[idx]?.completed;
                    return (
                      <li
                        key={idx}
                        className={`unit-list-item ${
                          selectedUnit === idx ? "active" : ""
                        } ${isUnlocked ? "" : "locked"}`}
                        onClick={() => isUnlocked && setSelectedUnit(idx)}
                      >
                        <div className="unit-info">
                          <span className="unit-title">
                            {u.title}
                            {isCompleted && (
                              <FaCheckCircle className="unit-status done" />
                            )}
                            {!isUnlocked && (
                              <FaLock className="unit-status locked" />
                            )}
                          </span>
                        </div>
                        <FaChevronRight className="chevron" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Col>

            <Col md={8} lg={9} xs={12}>
              <Card className="unit-content-card">
                <Card.Body>
                  <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
                    <h4 className="mb-2 mb-md-0">{unit.title}</h4>
                    {unitProgress?.completed && (
                      <Badge bg="success" className="unit-complete-badge">
                        <FaCheckCircle className="me-1" /> Completed
                      </Badge>
                    )}
                  </div>

                  <h6 className="section-title">Lessons</h6>
                  <Accordion defaultActiveKey="0" className="lesson-accordion">
                    {unit.lessons.map((lesson, idx) => {
                      const isLessonCompleted =
                        unitProgress?.lessonsCompleted?.some(
                          (l) => l.lessonIndex === idx && l.completed
                        );
                      return (
                        <Accordion.Item
                          eventKey={idx.toString()}
                          key={idx}
                          className={!isUnitUnlocked ? "locked-unit" : ""}
                        >
                          <Accordion.Header>
                            <span className="lesson-header">
                              <span className="lesson-title">
                                {lesson.title}
                                {isLessonCompleted && (
                                  <FaCheckCircle className="text-success ms-2" />
                                )}
                              </span>
                              <Badge
                                bg="light"
                                text="dark"
                                className="lesson-duration"
                              >
                                {lesson.duration} min
                              </Badge>
                            </span>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="lesson-content mb-3">
                              {lesson.content}
                            </div>
                            {/* Resources Section */}
                            {lesson.resources &&
                              lesson.resources.length > 0 && (
                                <div className="resources-section mb-3">
                                  <h6>Resources:</h6>
                                  {lesson.resources.map(
                                    (resource, resourceIdx) => {
                                      const isPdf =
                                        resource.type === "document" &&
                                        resource.url &&
                                        resource.url.startsWith(
                                          "data:application/pdf"
                                        );
                                      const handleResourceClick = () => {
                                        if (isPdf) {
                                          // Convert base64 to Blob and open in new tab
                                          const byteString = atob(
                                            resource.url.split(",")[1]
                                          );
                                          const ab = new ArrayBuffer(
                                            byteString.length
                                          );
                                          const ia = new Uint8Array(ab);
                                          for (
                                            let i = 0;
                                            i < byteString.length;
                                            i++
                                          ) {
                                            ia[i] = byteString.charCodeAt(i);
                                          }
                                          const blob = new Blob([ab], {
                                            type: "application/pdf",
                                          });
                                          const blobUrl =
                                            URL.createObjectURL(blob);
                                          const win = window.open(
                                            blobUrl,
                                            "_blank"
                                          );
                                          if (win) {
                                            win.document.title =
                                              resource.title || "Document";
                                          }
                                        } else if (
                                          resource.type === "document" &&
                                          resource.url
                                        ) {
                                          // For non-PDF documents, download
                                          const link =
                                            document.createElement("a");
                                          link.href = resource.url;
                                          link.download =
                                            resource.fileDetails
                                              ?.originalName ||
                                            resource.title ||
                                            "document";
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        } else {
                                          setSelectedResource({
                                            ...resource,
                                            unitIdx: selectedUnit,
                                            lessonIdx: idx,
                                            resourceIdx,
                                          });
                                          setShowResourceModal(true);
                                        }
                                      };

                                      return (
                                        <Button
                                          key={resourceIdx}
                                          variant="outline-secondary"
                                          size="sm"
                                          className="me-2 mb-2"
                                          onClick={handleResourceClick}
                                          disabled={!isUnitUnlocked}
                                        >
                                          {(resource.type === "video_url" ||
                                            resource.type === "video_file") && (
                                            <FaPlay className="me-1" />
                                          )}
                                          {(resource.type === "document" ||
                                            resource.type ===
                                              "document_url") && (
                                            <FaFile className="me-1" />
                                          )}
                                          {resource.title}
                                        </Button>
                                      );
                                    }
                                  )}
                                </div>
                              )}
                            {/* Video URL Section */}
                            {lesson.videoUrl && (
                              <div className="lesson-video mb-3">
                                {lesson.videoUrl.includes("youtube.com") ||
                                lesson.videoUrl.includes("youtu.be") ? (
                                  <div className="ratio ratio-16x9 mb-2">
                                    <iframe
                                      src={lesson.videoUrl}
                                      title="Lesson Video"
                                      allowFullScreen
                                    ></iframe>
                                  </div>
                                ) : (
                                  <a
                                    href={lesson.videoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-outline-primary btn-sm"
                                  >
                                    <FaPlay className="me-1" /> Watch Video
                                  </a>
                                )}
                              </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center">
                              <Button
                                size="sm"
                                variant={
                                  isLessonCompleted
                                    ? "success"
                                    : "outline-success"
                                }
                                onClick={() =>
                                  handleLessonComplete(selectedUnit, idx)
                                }
                                disabled={
                                  !isUnitUnlocked ||
                                  isLessonCompleted ||
                                  markingLesson[`${selectedUnit}-${idx}`]
                                }
                                className={`mark-complete-btn ${
                                  isLessonCompleted ? "completed" : ""
                                }`}
                              >
                                {markingLesson[`${selectedUnit}-${idx}`] ? (
                                  <Spinner size="sm" animation="border" />
                                ) : isLessonCompleted ? (
                                  <>
                                    <FaCheckCircle className="me-1" /> Completed
                                  </>
                                ) : (
                                  "Mark as Complete"
                                )}
                              </Button>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                  {/* Assignment Section */}
                  {unit.assignment && renderAssignment(unit, selectedUnit)}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      ) : (
        <Container className="mt-4">
          <Alert variant="info">No units available for this course.</Alert>
        </Container>
      )}

      {/* --- Certificate Alert at Bottom --- */}
      {certificate && (
        <div className="certificate-bottom-alert">
          <Container className="d-flex align-items-center justify-content-center flex-wrap">
            <FaCheckCircle className="me-2 text-white" size={22} />
            <span className="fw-bold text-white" style={{ fontSize: "1rem" }}>
              Certificate Received:
            </span>
            <span className="text-white ms-2" style={{ fontSize: "1rem" }}>
              Congratulations! You have completed this course.
            </span>
            <a
              href={certificate.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-light btn-sm ms-3"
              style={{ minWidth: 120, fontWeight: 600 }}
            >
              View Certificate
            </a>
          </Container>
        </div>
      )}

      {/* Resource Modal */}
      <ResourceModal
        resource={selectedResource}
        show={showResourceModal}
        onHide={() => {
          setShowResourceModal(false);
          setSelectedResource(null);
        }}
      />
    </div>
  );
};

export default CourseDetail;
