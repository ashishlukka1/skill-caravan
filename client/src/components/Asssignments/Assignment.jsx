import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, Spinner, Alert, Container, Card, ProgressBar, Badge, Toast, ToastContainer } from "react-bootstrap";
import { FaCheckCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
import axios from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";
import "./Assignment.css";

// --- Top-Right Alert Component ---
const TopRightAlert = ({ show, variant, message, onClose }) => {
  const iconMap = {
    success: <FaCheckCircle className="me-2" />,
    error: <FaTimes className="me-2" />,
    info: <span className="me-2">ℹ️</span>,
  };
  const backgroundMap = {
    success: "#4CAF50",
    error: "#F44336",
    info: "#2196F3",
  };
  return (
    <ToastContainer position="top-end" className="p-3" style={{ zIndex: 1060 }}>
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

// Utility to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LoadingSpinner = () => (
  <div className="loading-overlay">
    <Spinner animation="border" variant="primary" />
  </div>
);

const AssignmentQuiz = () => {
  const { id, unitIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [assignmentSet, setAssignmentSet] = useState(null);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]);

  // Alert states
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  // Helper to initialize answers and shuffle questions
  const initializeAssignment = (set, prevSubmission = null) => {
    if (!set) return;
    // Shuffle questions and keep track of their original indices
    const indices = Array.from({ length: set.questions.length }, (_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    setQuestionOrder(shuffledIndices);
    setShuffledQuestions(shuffledIndices.map(idx => set.questions[idx]));
    setAnswers(
      prevSubmission && prevSubmission.length === set.questions.length
        ? shuffledIndices.map(idx => prevSubmission[idx])
        : Array(set.questions.length).fill(null)
    );
    setCurrentQ(0);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`/api/courses/${id}`),
          axios.get(`/api/progress/${id}`)
        ]);
        
        const unit = courseRes.data.units[parseInt(unitIndex)];
        // Fix: Defensive checks for assignment structure
        if (
          !unit ||
          !unit.assignment ||
          !Array.isArray(unit.assignment.assignmentSets) ||
          unit.assignment.assignmentSets.length === 0
        ) {
          throw new Error("No assignment found for this unit");
        }

        setCourse(courseRes.data);
        setProgress(progressRes.data);

        const unitProg = progressRes.data.unitsProgress[parseInt(unitIndex)];
        let assignedSetNumber = unitProg?.assignment?.assignedSetNumber;

        // If not assigned yet, assign the first set by default
        if (!assignedSetNumber && unit.assignment.assignmentSets.length === 1) {
          assignedSetNumber = unit.assignment.assignmentSets[0].setNumber;
        }
        if (!assignedSetNumber && unit.assignment.assignmentSets.length > 1) {
          assignedSetNumber = unit.assignment.assignmentSets[0].setNumber;
        }

        // Find the assigned set
        const currentSet = unit.assignment.assignmentSets.find(
          set => set.setNumber === assignedSetNumber
        ) || unit.assignment.assignmentSets[0];

        setAssignmentSet(currentSet);

        // Shuffle questions and initialize answers
        if (currentSet) {
          initializeAssignment(currentSet, unitProg?.assignment?.submission);
        }

        setSubmitted(unitProg?.assignment?.status === "submitted");
        setScore(unitProg?.assignment?.score || 0);

      } catch (err) {
        console.error("Error fetching assignment:", err);
        setError(err.message || "Failed to load assignment");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line
  }, [id, unitIndex]);

  const handleSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setAnswers(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = optionIndex;
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (!assignmentSet) {
        throw new Error("No assignment set found");
      }
      // Map answers back to original question order for backend
      const reorderedAnswers = [];
      questionOrder.forEach((originalIdx, shuffledIdx) => {
        reorderedAnswers[originalIdx] = answers[shuffledIdx];
      });

      const totalPossibleMarks = assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0);

      const response = await axios.post(
        `/api/courses/${id}/assignment/${unitIndex}/submit`,
        {
          submission: reorderedAnswers
        }
      );

      setScore(response.data.score);
      setSubmitted(true);

      setAlertMessage("Assignment submitted!");
      setShowSuccessAlert(true);

      if (response.data.score === totalPossibleMarks) {
        // Only update progress if perfect score
        const progressRes = await axios.get(`/api/progress/${id}`);
        setProgress(progressRes.data);
      }

    } catch (err) {
      console.error("Submission error:", err);
      setAlertMessage(err.response?.data?.message || "Failed to submit assignment");
      setShowErrorAlert(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewAttempt = async () => {
    try {
      const currentUnit = course.units[parseInt(unitIndex)];
      const availableSets = currentUnit.assignment.assignmentSets;
      const currentSetNumber = assignmentSet.setNumber;

      if (availableSets.length === 1) {
        // Only one set: allow retry of the same set, but reshuffle questions
        initializeAssignment(assignmentSet);
        setSubmitted(false);
        setShowReview(false);
        setScore(0);
        return;
      }

      // Multiple sets: assign a new set (excluding the current one)
      const remainingSets = availableSets.filter(set => set.setNumber !== currentSetNumber);
      if (remainingSets.length === 0) {
        setAlertMessage("No more assignment sets available. Please return to the course.");
        setShowErrorAlert(true);
        navigate(`/courses/${id}`);
        return;
      }

      // Request new assignment set from backend
      const assignSetRes = await axios.post(
        `/api/progress/${id}/unit/${unitIndex}/assign-set`,
        {
          excludeSet: currentSetNumber
        }
      );
      // Find new assigned set
      const newUnitProg = assignSetRes.data.unitsProgress[parseInt(unitIndex)];
      const newSet = currentUnit.assignment.assignmentSets
        .find(set => set.setNumber === newUnitProg.assignment.assignedSetNumber);

      if (!newSet) {
        setAlertMessage("No more sets available");
        setShowErrorAlert(true);
        return;
      }

      setAssignmentSet(newSet);
      initializeAssignment(newSet);
      setSubmitted(false);
      setShowReview(false);
      setScore(0);
      setProgress(assignSetRes.data);

    } catch (err) {
      setAlertMessage("Could not assign new set. Returning to course.");
      setShowErrorAlert(true);
      navigate(`/courses/${id}`);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error || !course || !progress || !assignmentSet) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error || "Assignment not found"}</Alert>
        <Button variant="secondary" onClick={() => navigate(`/courses/${id}`)}>
          <FaArrowLeft className="me-2" /> Back to Course
        </Button>
      </Container>
    );
  }

  const totalQuestions = shuffledQuestions.length;
  const answeredQuestions = answers.filter(a => a !== null).length;
  const currentQuestion = shuffledQuestions[currentQ];

  return (
    <div className="assignment-quiz-main min-vh-100">
      {/* Top-Right Alerts */}
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
      <Container className="py-5">
        <Card className="assignment-card">
          <Card.Body>
            <div className="assignment-header d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
              <div>
                <h4>{assignmentSet.title}</h4>
                <p className="text-muted mb-0">{assignmentSet.description}</p>
                <div className="assignment-meta mt-2">
                  <span className="badge bg-info me-2">Set {assignmentSet.setNumber}</span>
                  <span className="badge bg-secondary">Difficulty: {assignmentSet.difficulty}</span>
                </div>
              </div>
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="mt-3 mt-md-0"
                onClick={() => navigate(`/courses/${id}`)}
              >
                <FaArrowLeft className="me-2" /> Back to Course
              </Button>
            </div>
            {!submitted && (
              <div className="quiz-section mt-4">
                <div className="progress-header mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted">
                      {answeredQuestions} of {totalQuestions} answered
                    </span>
                  </div>
                  <ProgressBar 
                    now={(answeredQuestions / totalQuestions) * 100}
                    variant="primary"
                    className="mt-2"
                  />
                </div>

                <Card className="question-card mt-4">
                  <Card.Body>
                    <h5 className="question-text mb-4">
                      {currentQuestion.questionText}
                    </h5>
                    
                    <div className="options-grid">
                      {currentQuestion.options.map((option, idx) => (
                        <Button
                          key={idx}
                          variant={answers[currentQ] === idx ? "primary" : "outline-primary"}
                          className="text-start p-3 mb-2 w-100"
                          onClick={() => handleSelect(currentQ, idx)}
                          disabled={submitting}
                        >
                          <div className="d-flex align-items-center">
                            <div className="me-3">{String.fromCharCode(65 + idx)}.</div>
                            <div>{option}</div>
                            {answers[currentQ] === idx && (
                              <FaCheckCircle className="ms-auto" />
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </Card.Body>
                </Card>

                <div className="navigation-footer mt-4 d-flex flex-column flex-md-row justify-content-between align-items-center">
                  <Button
                    variant="outline-primary"
                    disabled={currentQ === 0 || submitting}
                    onClick={() => setCurrentQ(prev => prev - 1)}
                    className="mb-2 mb-md-0"
                  >
                    Previous
                  </Button>

                  <div className="question-dots d-flex gap-2 mb-2 mb-md-0">
                    {Array(totalQuestions).fill(0).map((_, idx) => (
                      <button
                        key={idx}
                        className={`
                          question-dot 
                          ${idx === currentQ ? 'active' : ''} 
                          ${answers[idx] !== null ? 'answered' : ''}
                        `}
                        onClick={() => setCurrentQ(idx)}
                        disabled={submitting}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  {currentQ === totalQuestions - 1 ? (
                    <Button
                      variant="success"
                      onClick={handleSubmit}
                      disabled={answers.some(a => a === null) || submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Submitting...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => setCurrentQ(prev => prev + 1)}
                      disabled={submitting}
                    >
                      Next
                    </Button>
                  )}
                </div>
              </div>
            )}
            {submitted && (
              <div className="score-section">
                <div className="score-circle">
                  <div>
                    <div className="score-label">Score</div>
                    <div className="score-value">
                      {score}/{assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0)}
                    </div>
                  </div>
                </div>
                <h5 className="mt-4 text-center">
                  {score === assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0) 
                    ? "Perfect Score! Assignment Complete!" 
                    : "Assignment Submitted"}
                </h5>
                <div className="mt-3 text-center">
                  <Button
                    variant="primary"
                    onClick={() => setShowReview(!showReview)}
                    className="me-2"
                  >
                    {showReview ? 'Hide Review' : 'Show Review'}
                  </Button>
                  {score === assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0) && (
                    <Button
                      variant="success"
                      onClick={() => navigate(`/courses/${id}`)}
                    >
                      Return to Course
                    </Button>
                  )}
                  {score < assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0) && (
                    <Button
                      variant="success"
                      onClick={handleNewAttempt}
                    >
                      {assignmentSet && course.units[parseInt(unitIndex)].assignment.assignmentSets.length === 1
                        ? "Retry Assignment"
                        : "Try Another Set"}
                    </Button>
                  )}
                </div>
                
                {showReview && (
                  <div className="review-section mt-4">
                    <div className="score-summary mb-4">
                      <Card className="summary-card">
                        <Card.Body>
                          <h6>Assignment Summary</h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <span>Total Questions:</span>
                            <span>{assignmentSet.questions.length}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span>Correct Answers:</span>
                            <span className="text-success">
                              {assignmentSet.questions.filter((q, idx) => 
                                answers[idx] === parseInt(q.correctAnswer)
                              ).length}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span>Score Achieved:</span>
                            <span className={score === assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0) 
                              ? "text-success" 
                              : "text-warning"
                            }>
                              {((score / assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </Card.Body>
                      </Card>
                    </div>

                    <div className="questions-review">
                      {assignmentSet.questions.map((question, originalIdx) => {
                        // Find the shuffled index for this original question
                        const shuffledIdx = questionOrder.indexOf(originalIdx);
                        const userAnswer = answers[shuffledIdx];
                        const isCorrect = userAnswer === parseInt(question.correctAnswer);

                        return (
                          <Card key={originalIdx} className={`question-review-card mb-4 ${isCorrect ? 'border-success' : 'border-danger'}`}>
                            <Card.Header className="d-flex justify-content-between align-items-center">
                              <span>Question {originalIdx + 1}</span>
                              <Badge bg={isCorrect ? "success" : "danger"}>
                                {isCorrect ? (
                                  <><FaCheckCircle className="me-1" /> {question.marks} marks</>
                                ) : (
                                  <><FaTimes className="me-1" /> 0/{question.marks} marks</>
                                )}
                              </Badge>
                            </Card.Header>
                            <Card.Body>
                              <Card.Text className="mb-4">{question.questionText}</Card.Text>
                              <div className="options-grid">
                                {question.options.map((option, optIdx) => (
                                  <div
                                    key={optIdx}
                                    className={`
                                      option-item p-3 rounded
                                      ${optIdx === userAnswer ? 'selected' : ''}
                                      ${optIdx === parseInt(question.correctAnswer) ? 'correct' : ''}
                                      ${optIdx === userAnswer && !isCorrect ? 'incorrect' : ''}
                                    `}
                                  >
                                    <div className="d-flex align-items-center">
                                      <div className="option-marker me-3">
                                        {optIdx === parseInt(question.correctAnswer) && (
                                          <FaCheckCircle className="text-success" />
                                        )}
                                        {optIdx === userAnswer && !isCorrect && (
                                          <FaTimes className="text-danger" />
                                        )}
                                      </div>
                                      <div className="option-text">{option}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {!isCorrect && (
                                <Alert variant="info" className="mt-3 mb-0">
                                  The correct answer was: {question.options[parseInt(question.correctAnswer)]}
                                </Alert>
                              )}
                            </Card.Body>
                          </Card>
                        );
                      })}
                    </div>

                    <div className="review-actions mt-4 text-center">
                      {score < assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0) ? (
                        <Alert variant="warning">
                          You need a perfect score to complete this unit. {assignmentSet && course.units[parseInt(unitIndex)].assignment.assignmentSets.length === 1
                            ? "Retry the assignment until you achieve a perfect score."
                            : "Try another set!"}
                        </Alert>
                      ) : (
                        <Alert variant="success">
                          Congratulations! You've completed this unit's assignment!
                        </Alert>
                      )}
                      
                      <Button
                        variant={score === assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0) 
                          ? "success" 
                          : "primary"
                        }
                        onClick={() => {
                          if (score === assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0)) {
                            navigate(`/courses/${id}`);
                          } else {
                            handleNewAttempt();
                          }
                        }}
                        className="mt-3"
                      >
                        {score === assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0)
                          ? "Return to Course"
                          : (assignmentSet && course.units[parseInt(unitIndex)].assignment.assignmentSets.length === 1
                            ? "Retry Assignment"
                            : "Try Another Set")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
};

export default AssignmentQuiz;