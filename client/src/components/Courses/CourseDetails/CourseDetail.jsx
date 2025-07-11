import React, { useState, useEffect, useContext, useRef } from "react";
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
  Collapse,
} from "react-bootstrap";
import {
  FaLock,
  FaCheckCircle,
  FaChevronDown,
  FaChevronRight,
  FaPlay,
  FaFile,
  FaClock,
  FaPlayCircle,
  FaFilePdf,
  FaVideo,
  FaEye,
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

// Use the Adobe PDF Embed API demo client ID for localhost/dev
const ADOBE_CLIENT_ID = "66fb8d039f5045da8f1485fe6e3117a1";

const CourseDetail = () => {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState([0]);
  const [expandedLessons, setExpandedLessons] = useState({});
  const [activeResourceIdx, setActiveResourceIdx] = useState(0);

  // Alerts
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState("info");
  const [alertMsg, setAlertMsg] = useState("");

  const [markingLesson, setMarkingLesson] = useState({});
  const [error, setError] = useState("");
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Adobe PDF SDK integration
  const pdfContainerRef = useRef(null);
  const [pdfRenderedId, setPdfRenderedId] = useState(null);

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
  }, [id, user]);

  // Load Adobe PDF SDK once
  useEffect(() => {
    if (!window.AdobeDC) {
      const script = document.createElement('script');
      script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  // Certificate Notification Logic
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
      setAlertMsg("Your certificate has been issued.");
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

  // Toggle unit expansion
  const toggleUnit = (unitIdx) => {
    setExpandedUnits(prev =>
      prev.includes(unitIdx)
        ? prev.filter(idx => idx !== unitIdx)
        : [...prev, unitIdx]
    );
  };

  // Select lesson for main content view
  const selectLesson = (unitIdx, lessonIdx) => {
    setSelectedLesson({ unitIdx, lessonIdx });
    setActiveResourceIdx(0);
    setPdfRenderedId(null);
  };

  // Stats helpers
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

  const handleAssignmentButtonClick = (unitIdx, unitProgress, unit) => {
    const isPerfect = isAssignmentPerfect(unit, unitProgress);
    if (isPerfect) return;
    if (unitProgress?.assignment?.assignedSetNumber) {
      // Navigate to assignment quiz page
      navigate(`/courses/${id}/assignment/${unitIdx}`);
    } else {
      handleAssignmentStart(unitIdx);
    }
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
    return "Continue Assessment";
  };

  // Render PDF using Adobe SDK (only one at a time)
  const renderPDF = (resource, containerId) => {
    if (
      window.AdobeDC &&
      resource.url &&
      resource.url.startsWith("data:application/pdf") &&
      pdfRenderedId !== containerId
    ) {
      // Convert base64 to blob URL
      const byteString = atob(resource.url.split(",")[1]);
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: "application/pdf" });
      const blobUrl = URL.createObjectURL(blob);

      setTimeout(() => {
        if (document.getElementById(containerId)) {
          document.getElementById(containerId).innerHTML = "";
          const adobeDCView = new window.AdobeDC.View({
            clientId: ADOBE_CLIENT_ID,
            divId: containerId,
          });
          adobeDCView.previewFile(
            {
              content: { location: { url: blobUrl } },
              metaData: { fileName: resource.title || "Document.pdf" },
            },
            {
              embedMode: "IN_LINE",
              showAnnotationTools: false,
              showLeftHandPanel: false,
              showDownloadPDF: false,
              showPrintPDF: false,
            }
          );
          setPdfRenderedId(containerId);
        }
      }, 100);
    }
  };

  // Render video content
  const renderVideo = (resource) => {
    if (resource.type === "video_url") {
      // Handle YouTube URLs
      if (resource.url.includes("youtube.com") || resource.url.includes("youtu.be")) {
        let embedUrl = resource.url;
        if (resource.url.includes("youtube.com/watch")) {
          const videoId = resource.url.split("v=")[1]?.split("&")[0];
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        } else if (resource.url.includes("youtu.be")) {
          const videoId = resource.url.split("/").pop();
          embedUrl = `https://www.youtube.com/embed/${videoId}`;
        }
        return (
          <div className="video-container">
            <div className="ratio ratio-16x9">
              <iframe
                src={embedUrl}
                title={resource.title}
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              ></iframe>
            </div>
          </div>
        );
      }
    } else if (resource.type === "video_file") {
      return (
        <div className="video-container">
          <video controls className="w-100" style={{ maxHeight: "400px" }}>
            <source src={resource.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    return null;
  };

  // Get resource icon
  const getResourceIcon = (resource) => {
    if (resource.type === "video_url" || resource.type === "video_file") {
      return <FaPlayCircle className="text-primary me-2" />;
    } else if (resource.type === "document") {
      return <FaFilePdf className="text-danger me-2" />;
    }
    return <FaFile className="text-secondary me-2" />;
  };

  // Check if lesson is completed
  const isLessonCompleted = (unitIdx, lessonIdx) => {
    const unitProgress = progress?.unitsProgress?.[unitIdx];
    return unitProgress?.lessonsCompleted?.some(
      (l) => l.lessonIndex === lessonIdx && l.completed
    );
  };

  // Check if unit is unlocked
  const isUnitUnlocked = (unitIdx) => {
    return unitIdx === 0 || progress?.unitsProgress?.[unitIdx - 1]?.completed;
  };

  // RENDER LOGIC
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

  const hasUnits = Array.isArray(course?.units) && course.units.length > 0;
  const selectedLessonData = selectedLesson ?
    course.units[selectedLesson.unitIdx]?.lessons[selectedLesson.lessonIdx] : null;

  return (
    <div className="coursera-style-course min-vh-100">
      {/* Top-Right Alerts */}
      <TopRightAlert
        show={showAlert}
        variant={alertType}
        message={alertMsg}
        onClose={() => setShowAlert(false)}
      />

      <Container fluid className="p-0">
        <Row className="g-0">
          {/* Left Sidebar - Course Structure */}
          <Col lg={4} md={5} className="course-sidebar">
            <div className="sidebar-content">
              {/* Course Header */}
              <div className="course-header-sidebar">
                <h4 className="course-title1">{course.title}</h4>
                <p className="course-description">{course.description}</p>
                <div className="course-meta mb-3">
                  <Badge bg="primary" className="me-1">{course.category}</Badge>
                  <Badge bg="secondary" className="me-1">{course.difficulty}</Badge>
                  <span className="text-muted d-flex align-items-center">
                    <FaClock className="me-1" /> {course.duration} minutes
                  </span>
                </div>
                <ProgressBar
                  now={progress?.progress || 0}
                  label={`${progress?.progress || 0}%`}
                  className="mb-3"
                />
              </div>

              {/* Units and Lessons */}
              <div className="units-container">
                {hasUnits && course.units.map((unit, unitIdx) => {
                  const unitProgress = progress?.unitsProgress?.[unitIdx];
                  const isUnlocked = isUnitUnlocked(unitIdx);
                  const isCompleted = unitProgress?.completed;
                  const isExpanded = expandedUnits.includes(unitIdx);

                  return (
                    <div key={unitIdx} className="unit-section1">
                      <div
                        className={`unit-header1 ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => isUnlocked && toggleUnit(unitIdx)}
                      >
                        <div className="unit-info">
                          <h6 className="unit-title">
                            {unit.title}
                            {isCompleted && <FaCheckCircle className="text-success ms-2" />}
                            {!isUnlocked && <FaLock className="text-muted ms-2" />}
                          </h6>
                        </div>
                        {isUnlocked && (
                          <div className="unit-toggle">
                            {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
                          </div>
                        )}
                      </div>

                      <Collapse in={isExpanded && isUnlocked}>
                        <div className="lessons-list">
                          {unit.lessons.map((lesson, lessonIdx) => {
                            const lessonCompleted = isLessonCompleted(unitIdx, lessonIdx);
                            const isSelected = selectedLesson?.unitIdx === unitIdx &&
                              selectedLesson?.lessonIdx === lessonIdx;

                            return (
                              <div
                                key={lessonIdx}
                                className={`lesson-item1 ${isSelected ? 'selected' : ''} ${lessonCompleted ? 'completed' : ''}`}
                              >
                                <div
                                  className="lesson-header"
                                  onClick={() => selectLesson(unitIdx, lessonIdx)}
                                >
                                  <div className="lesson-info">
                                    <div className="lesson-title">
                                      {lesson.title}
                                      {lessonCompleted && <FaCheckCircle className="text-success ms-2" />}
                                    </div>
                                    <div className="lesson-meta">
                                      <span className="duration">
                                        <FaClock className="me-1" /> {lesson.duration} min
                                      </span>
                                    </div>
                                  </div>
                                  <Button
                                    variant={lessonCompleted ? "success" : "outline-primary"}
                                    size="sm"
                                    className="mark-complete-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLessonComplete(unitIdx, lessonIdx);
                                    }}
                                    disabled={
                                      !isUnlocked ||
                                      lessonCompleted ||
                                      markingLesson[`${unitIdx}-${lessonIdx}`]
                                    }
                                  >
                                    {markingLesson[`${unitIdx}-${lessonIdx}`] ? (
                                      <Spinner size="sm" animation="border" />
                                    ) : lessonCompleted ? (
                                      <FaCheckCircle />
                                    ) : (
                                      "Mark as Completed"
                                    )}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}

                          {/* Assignment */}
                          {unit.assignment && (
                            <div className="assignment-item">
                              <div className="assignment-header1">
                                <div className="assignment-info">
                                  <h6 className="assignment-title">Assessment</h6>
                                  <p className="assignment-description">
                                    Complete the unit assessment
                                  </p>
                                </div>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleAssignmentButtonClick(unitIdx, unitProgress, unit)}
                                  disabled={!isUnlocked || !areAllLessonsCompleted(unitIdx)}
                                >
                                  {getAssignmentButtonText(unitIdx, unitProgress, unit)}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </Collapse>
                    </div>
                  );
                })}
              </div>
            </div>
          </Col>

          {/* Main Content Area */}
          <Col lg={8} md={7} className="main-content">
            <div className="content-area">
              {selectedLessonData ? (
                <div className="lesson-content">
                  <div className="lesson-header-main">
                    <h2 className="lesson-title">{selectedLessonData.title}</h2>
                    <Badge bg="info" className="duration-badge">
                      <FaClock className="me-1" /> {selectedLessonData.duration} min
                    </Badge>
                  </div>

                  {/* Resources Section */}
                  {selectedLessonData.resources && selectedLessonData.resources.length > 0 && (
                    <div className="resources-section1">
                      {/* Toggle buttons for resources */}
                      {selectedLessonData.resources.length > 1 && (
                        <div className="d-flex mb-3 gap-2">
                          {selectedLessonData.resources.map((resource, idx) => (
                            <Button
                              key={idx}
                              variant={activeResourceIdx === idx ? "primary" : "outline-primary"}
                              size="sm"
                              onClick={() => {
                                setActiveResourceIdx(idx);
                                setPdfRenderedId(null);
                              }}
                            >
                              {resource.title}
                            </Button>
                          ))}
                        </div>
                      )}
                      {selectedLessonData.resources.map((resource, resourceIdx) => {
                        // Only show the active resource if multiple
                        if (
                          selectedLessonData.resources.length > 1 &&
                          resourceIdx !== activeResourceIdx
                        ) {
                          return null;
                        }
                        const resourceId = `resource-${selectedLesson.unitIdx}-${selectedLesson.lessonIdx}-${resourceIdx}`;
                        return (
                          <div key={resourceIdx} className="resource-content">
                            <div className="resource-header">
                              {getResourceIcon(resource)}
                              <h6>{resource.title}</h6>
                            </div>
                            {/* Render based on resource type */}
                            {(resource.type === "video_url" || resource.type === "video_file") && (
                              <div className="resource-viewer">
                                {renderVideo(resource)}
                              </div>
                            )}
                            {resource.type === "document" && resource.url && resource.url.startsWith("data:application/pdf") && (
                              <div className="resource-viewer">
                                <div
                                  id={resourceId}
                                  className="pdf-viewer"
                                  style={{ width: "100%", height: "600px" }}
                                  ref={pdfContainerRef}
                                >
                                  {/* PDF will be rendered here by Adobe SDK */}
                                  {renderPDF(resource, resourceId)}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Video URL from lesson */}
                  {selectedLessonData.videoUrl && (
                    <div className="lesson-video-section">
                      <h5 className="section-title">Lesson Video</h5>
                      <div className="video-container">
                        {selectedLessonData.videoUrl.includes("youtube.com") ||
                        selectedLessonData.videoUrl.includes("youtu.be") ? (
                          <div className="ratio ratio-16x9">
                            <iframe
                              src={selectedLessonData.videoUrl}
                              title="Lesson Video"
                              allowFullScreen
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            ></iframe>
                          </div>
                        ) : (
                          <a
                            href={selectedLessonData.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                          >
                            <FaPlay className="me-2" /> Watch Video
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Lesson Content */}
                  <div className="lesson-text-content">
                    <div className="content-text">
                      {selectedLessonData.content}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-lesson-selected">
                  <div className="welcome-content">
                    <h3>Welcome to {course.title}</h3>
                    <p>Select a lesson from the sidebar to begin learning.</p>
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="course-thumbnail1"
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>

      {/* Certificate Alert at Bottom */}
      {certificate && (
        <div className="certificate-bottom-alert">
          <Container className="d-flex align-items-center justify-content-center flex-wrap">
            <FaCheckCircle className="me-2 text-white" size={22} />
            <span className="fw-bold text-white">Certificate Received:</span>
            <span className="text-white ms-2">
              Congratulations! You have completed this course.
            </span>
            <a
              href={certificate.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-light btn-sm ms-3"
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