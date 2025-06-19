import React, { useState, useEffect, useContext } from "react";
import { Container, Row, Col, Badge, Spinner, Alert, Button, ProgressBar, Card, Accordion, Modal } from "react-bootstrap";
import { FaLock, FaCheckCircle, FaChevronRight, FaPlay, FaFile } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";
import "./CourseDetail.css";

const ResourceModal = ({ resource, show, onHide, onComplete }) => {
  if (!resource) return null;

  //to prevent closing the modal if the resouce is a video file or video URL
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
      size="lg"
      backdrop={isVideo ? "static" : true}
      keyboard={!isVideo ? true : false}
    >
      <Modal.Header closeButton>
        <Modal.Title>{resource.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {resource.type === 'video_url' && (
          <div className="ratio ratio-16x9">
            <iframe
              src={isYouTubeUrl(resource.url) ? getYouTubeEmbedUrl(resource.url) : resource.url}
              title={resource.title}
              allowFullScreen
              style={{ border: 0, width: "100%", height: "100%" }}
            ></iframe>
          </div>
        )}
        {resource.type === 'video_file' && (
          <video className="w-100" controls>
            <source src={resource.url} type={resource.fileDetails?.contentType || "video/mp4"} />
            Your browser does not support the video tag.
          </video>
        )}
        {(resource.type === 'document' || resource.type === 'document_url') && (
          <div className="text-center">
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


const CourseDetail = () => {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const [showResourceModal, setShowResourceModal] = useState(false);

  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const courseRes = await axios.get(`/api/courses/${id}`);
        setCourse(courseRes.data);

        if (user) {
          const isUserEnrolled = courseRes.data.studentsEnrolled.includes(user._id);
          setIsEnrolled(isUserEnrolled);

          if (isUserEnrolled) {
            try {
              const progressRes = await axios.get(`/api/progress/${id}`);
              setProgress(progressRes.data);
            } catch (progressErr) {
              console.error("Error fetching progress:", progressErr);
            }
          }
        }
      } catch (err) {
        console.error("Error loading course:", err);
        setError("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setEnrolling(true);
    try {
      const enrollRes = await axios.post(`/api/courses/${id}/enroll`);
      if (enrollRes.data.enrollment) {
        setProgress(enrollRes.data.enrollment);
        setIsEnrolled(true);
        setCourse(prev => ({
          ...prev,
          studentsEnrolled: [...prev.studentsEnrolled, user._id]
        }));
      }
    } catch (err) {
      console.error("Enrollment error:", err);
      const errorMessage = err.response?.data?.message || "Failed to enroll in course";
      setError(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const [markingLesson, setMarkingLesson] = useState({}); // { "unitIdx-lessonIdx": true }

const handleLessonComplete = async (unitIdx, lessonIdx) => {
  if (!isEnrolled) return;
  setMarkingLesson(prev => ({ ...prev, [`${unitIdx}-${lessonIdx}`]: true }));
  try {
    await axios.post(
      `/api/progress/${id}/unit/${unitIdx}/lesson/${lessonIdx}`,
      { completed: true }
    );
    // Fetch the updated progress
    const progressRes = await axios.get(`/api/progress/${id}`);
    setProgress(progressRes.data);
  } catch (err) {
    console.error("Error completing lesson:", err);
    setError("Failed to update lesson progress");
  } finally {
    setMarkingLesson(prev => ({ ...prev, [`${unitIdx}-${lessonIdx}`]: false }));
  }
};

  const handleResourceComplete = async (unitIdx, lessonIdx, resourceId) => {
    if (!isEnrolled) return;
    try {
      const response = await axios.post(
        `/api/progress/${id}/unit/${unitIdx}/lesson/${lessonIdx}`,
        {
          resourceId,
          resourceProgress: {
            completed: true,
            watchTime: 0
          }
        }
      );
      setProgress(response.data);
    } catch (err) {
      console.error("Error completing resource:", err);
      setError("Failed to update resource progress");
    }
  };

  const handleAssignmentStart = async (unitIdx) => {
    if (!isEnrolled) return;
    try {
      const unit = course.units[unitIdx];
      const assignmentSets = unit.assignment?.assignmentSets;
      if (!assignmentSets?.length) {
        setError("No assignment sets available");
        return;
      }
      const randomSetNumber = assignmentSets.length === 1 
        ? assignmentSets[0].setNumber
        : assignmentSets[Math.floor(Math.random() * assignmentSets.length)].setNumber;

      const response = await axios.post(
        `/api/progress/${id}/unit/${unitIdx}/assign-set`,
        { setNumber: randomSetNumber }
      );
      setProgress(response.data);
    } catch (err) {
      console.error("Error assigning set:", err);
      setError("Failed to assign assignment set");
    }
  };

  const handleResourceClick = (resource, unitIdx, lessonIdx, resourceIdx) => {
    setSelectedResource({ ...resource, unitIdx, lessonIdx, resourceIdx });
    setShowResourceModal(true);
  };

  const areAllLessonsCompleted = (unitIdx) => {
    const unitProgress = progress?.unitsProgress?.[unitIdx];
    const unit = course?.units?.[unitIdx];
    if (!unit || !unitProgress) return false;
    return unitProgress.lessonsCompleted?.length === unit.lessons.length &&
           unitProgress.lessonsCompleted.every(l => l.completed);
  };

  // Helper to get the total possible score for the assigned set
  const getAssignedSetTotalScore = (unit, unitProgress) => {
    if (!unit || !unit.assignment?.assignmentSets?.length) return 0;
    const assignedSetNumber = unitProgress?.assignment?.assignedSetNumber;
    let assignedSet;
    if (assignedSetNumber) {
      assignedSet = unit.assignment.assignmentSets.find(set => set.setNumber === assignedSetNumber);
    } else if (unit.assignment.assignmentSets.length === 1) {
      assignedSet = unit.assignment.assignmentSets[0];
    }
    return assignedSet
      ? assignedSet.questions.reduce((acc, q) => acc + q.marks, 0)
      : 0;
  };

  // Helper to check if assignment is perfectly completed
 const isAssignmentPerfect = (unit, unitProgress) => {
  if (!unit || !unitProgress?.assignment) return false;
  // Find the set that was last assigned/submitted
  let assignedSet;
  if (unitProgress.assignment.assignedSetNumber) {
    assignedSet = unit.assignment.assignmentSets.find(
      set => set.setNumber === unitProgress.assignment.assignedSetNumber
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
  const isUnitUnlocked = unitIdx === 0 || progress?.unitsProgress?.[unitIdx - 1]?.completed;
  if (!isUnitUnlocked) return "Complete previous unit first";
  if (!areAllLessonsCompleted(unitIdx)) return "Complete all lessons first";
  if (isAssignmentPerfect(unit, unitProgress)) return "Assignment Complete";
  if (isAssignmentSubmitted(unitProgress)) return "Review Assignment";
  if (!unitProgress?.assignment?.assignedSetNumber) return "Start Assignment";
  return "Continue Assignment";
};

  const renderAssignment = (unit, unitIdx) => {
  if (!unit.assignment?.assignmentSets?.length) return null;
  const unitProgress = progress?.unitsProgress?.[unitIdx];
  const isUnitUnlocked = unitIdx === 0 || progress?.unitsProgress?.[unitIdx - 1]?.completed;
  const assignedSetNumber = unitProgress?.assignment?.assignedSetNumber;
  let assignedSet;
  if (assignedSetNumber) {
    assignedSet = unit.assignment.assignmentSets.find(set => set.setNumber === assignedSetNumber);
  } else if (unit.assignment.assignmentSets.length === 1) {
    assignedSet = unit.assignment.assignmentSets[0];
  }
  const totalScore = assignedSet
    ? assignedSet.questions.reduce((acc, q) => acc + q.marks, 0)
    : 0;
  const assignmentPerfect = isAssignmentPerfect(unit, unitProgress);
  const assignmentSubmitted = isAssignmentSubmitted(unitProgress);

  return (
    <div className="assignment-section mt-4">
      <h6 className="section-title">Assignment</h6>
      <Card className="assignment-card1">
        <Card.Body>
          {assignedSet ? (
            <>
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="assignment-title">{assignedSet.title}</h5>
                  <p className="assignment-description mb-2">{assignedSet.description}</p>
                  <Badge bg="info" className="me-2">Set {assignedSet.setNumber}</Badge>
                  <Badge bg="secondary">Difficulty: {assignedSet.difficulty}</Badge>
                </div>
                {assignmentSubmitted && (
                  <Badge bg={assignmentPerfect ? "success" : "warning"}>
                    Score: {unitProgress.assignment.score}
                  </Badge>
                )}
              </div>
              <div className="text-end">
                {assignmentPerfect ? (
                  <Badge bg="success" className="py-2 px-3 fs-6">Assignment Complete</Badge>
                ) : (
                  <Button
                    variant={
                      assignmentSubmitted
                        ? "outline-success"
                        : "primary"
                    }
                    onClick={() => {
                      navigate(`/courses/${id}/assignment/${unitIdx}`);
                    }}
                    disabled={
                      !isUnitUnlocked ||
                      !areAllLessonsCompleted(unitIdx)
                    }
                  >
                    {getAssignmentButtonText(unitIdx, unitProgress, unit)}
                  </Button>
                )}
              </div>
            </>
          ) : (
            assignmentPerfect ? (
              <div className="text-center py-3">
                <Badge bg="success">Assignment Complete</Badge>
              </div>
            ) : isUnitUnlocked && areAllLessonsCompleted(unitIdx) ? (
              <>
                <p className="mb-3">Ready to start your assignment?</p>
                <Button
                  variant="primary"
                  onClick={() => handleAssignmentStart(unitIdx)}
                >
                  Start Assignment
                </Button>
              </>
            ) : (
              <>
                <FaLock className="mb-2" size={24} />
                <p className="mb-0">Complete all lessons to unlock the assignment.</p>
              </>
            )
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

  if (loading) {
    return (
      <div className="text-center m-5 py-5">
        <Spinner animation="border" variant="primary" className="m-5"/>
      </div>
    );
  }

  if (error || !course) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error || "Course not found"}</Alert>
      </Container>
    );
  }

  const unit = course.units[selectedUnit];
  const unitProgress = progress?.unitsProgress?.[selectedUnit];
  const isUnitUnlocked = selectedUnit === 0 || progress?.unitsProgress?.[selectedUnit - 1]?.completed;

  // Helper to check if a URL is a YouTube link
  const isYouTubeUrl = (url) =>
    url.includes("youtube.com") || url.includes("youtu.be");

  // Helper to get YouTube embed URL
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
    <div className="course-detail-page">
      <div className="course-header">
        <Container>
          <Row className="align-items-center">
            <Col md={8}>
              <h1>{course.title}</h1>
              <p className="course-description">{course.description}</p>
              <div className="course-meta">
                <Badge bg="primary" className="me-2">{course.category}</Badge>
                <Badge bg="secondary" className="me-2">{course.difficulty}</Badge>
                <span className="me-3">
                  <i className="far fa-clock"></i> {course.duration} minutes
                </span>
              </div>
              {isEnrolled ? (
                <div className="mt-3">
                  <ProgressBar 
                    now={progress?.progress || 0} 
                    label={`${progress?.progress || 0}% Complete`}
                    variant="info"
                  />
                </div>
              ) : (
                <div className="mt-3">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleEnroll}
                    disabled={enrolling}
                  >
                    {enrolling ? 'Enrolling...' : 'Enroll Now'}
                  </Button>
                </div>
              )}
            </Col>
            <Col md={4} className="text-end">
              {course.thumbnail && (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="course-thumbnail"
                />
              )}
            </Col>
          </Row>
        </Container>
      </div>

      {!isEnrolled ? (
        <Container className="mt-4 mb-4">
          <Card className="course-preview-card">
            <Card.Body className="text-center">
              <FaLock className="preview-lock-icon mb-3" size={40} />
              <h3>Course Content Locked</h3>
              <p className="text-muted">
                Enroll in this course to access all lessons and assignments.
              </p>
              <Button
                variant="primary"
                size="md"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? 'Enrolling...' : 'Enroll Now'}
              </Button>
            </Card.Body>
          </Card>
        </Container>
      ) : (
        <Container className="mt-4">
          <Row>
            <Col md={4} lg={3}>
              <div className="units-sidebar">
                <h5 className="mb-3">Course Units</h5>
                <ul className="units-list">
                  {course.units.map((u, idx) => {
                    const isUnlocked = idx === 0 || progress?.unitsProgress?.[idx - 1]?.completed;
                    const isCompleted = progress?.unitsProgress?.[idx]?.completed;
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
                            {isCompleted && <FaCheckCircle className="unit-status done" />}
                            {!isUnlocked && <FaLock className="unit-status locked" />}
                          </span>
                        </div>
                        <FaChevronRight className="chevron" />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Col>

            <Col md={8} lg={9}>
              <Card className="unit-content-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="mb-0">{unit.title}</h4>
                    {unitProgress?.completed && (
                      <Badge bg="success" className="unit-complete-badge">
                        <FaCheckCircle className="me-1" /> Completed
                      </Badge>
                    )}
                  </div>
                  
                  <h6 className="section-title">Lessons</h6>
                  <Accordion defaultActiveKey="0" className="lesson-accordion">
                    {unit.lessons.map((lesson, idx) => {
                      const isLessonCompleted = unitProgress?.lessonsCompleted?.some(
                        l => l.lessonIndex === idx && l.completed
                      );
                      return (
                        <Accordion.Item 
                          eventKey={idx.toString()} 
                          key={idx}
                          className={!isUnitUnlocked ? 'locked-unit' : ''}
                        >
                          <Accordion.Header>
                            <span className="lesson-header">
                              <span className="lesson-title">
                                {lesson.title}
                                {isLessonCompleted && (
                                  <FaCheckCircle className="text-success ms-2" />
                                )}
                              </span>
                              <Badge bg="light" text="dark" className="lesson-duration">
                                {lesson.duration} min
                              </Badge>
                            </span>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="lesson-content mb-3">{lesson.content}</div>
                            {/* Resources Section */}
                            {lesson.resources && lesson.resources.length > 0 && (
                              <div className="resources-section mb-3">
                                <h6>Resources:</h6>
                                {lesson.resources.map((resource, resourceIdx) => (
                                  <Button
                                    key={resourceIdx}
                                    variant="outline-secondary"
                                    size="sm"
                                    className="me-2 mb-2"
                                    onClick={() => handleResourceClick(resource, selectedUnit, idx, resourceIdx)}
                                    disabled={!isUnitUnlocked}
                                  >
                                    {(resource.type === 'video_url' || resource.type === 'video_file') && <FaPlay className="me-1" />}
                                    {(resource.type === 'document' || resource.type === 'document_url') && <FaFile className="me-1" />}
                                    {resource.title}
                                  </Button>
                                ))}
                              </div>
                            )}
                            {/* Video URL Section */}
                            {lesson.videoUrl && (
                              <div className="lesson-video mb-3">
                                {isYouTubeUrl(lesson.videoUrl) ? (
                                  <div className="ratio ratio-16x9 mb-2">
                                    <iframe
                                      src={getYouTubeEmbedUrl(lesson.videoUrl)}
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
  variant={isLessonCompleted ? "success" : "outline-success"}
  onClick={() => handleLessonComplete(selectedUnit, idx)}
  disabled={!isUnitUnlocked || isLessonCompleted || markingLesson[`${selectedUnit}-${idx}`]}
  className={`mark-complete-btn ${isLessonCompleted ? 'completed' : ''}`}
>
  {markingLesson[`${selectedUnit}-${idx}`]
    ? <Spinner size="sm" animation="border" />
    : isLessonCompleted
      ? (<><FaCheckCircle className="me-1" /> Completed</>)
      : "Mark as Complete"}
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
      )}

      {/* Resource Modal */}
      <ResourceModal
        resource={selectedResource}
        show={showResourceModal}
        onHide={() => {
          setShowResourceModal(false);
          setSelectedResource(null);
        }}
        onComplete={
          selectedResource
            ? () => {
                handleResourceComplete(
                  selectedResource.unitIdx,
                  selectedResource.lessonIdx,
                  selectedResource._id || selectedResource.resourceIdx
                );
                setShowResourceModal(false);
                setSelectedResource(null);
              }
            : null
        }
      />
    </div>
  );
};

export default CourseDetail;