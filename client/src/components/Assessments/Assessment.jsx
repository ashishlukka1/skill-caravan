import React from "react";
import { Spinner, Alert, Container, Card, Button, ProgressBar } from "react-bootstrap";
import { FaCheckCircle, FaArrowLeft } from "react-icons/fa";
import TopRightAlert from "../../utils/TopRightAlert";
import AssignmentReview from "./AssessmentReview";
import { useAssignmentLogic } from "./AssessmentLogic";
import SecureAssessmentWrapper from "./SecureAssessmentWrapper";
import Loading from "../../utils/Loading";
import "./Assessment.css";

const Assessment = () => {
  const logic = useAssignmentLogic();

  const {
    id,
    unitIndex,
    course,
    progress,
    loading,
    submitting,
    error,
    currentQ,
    setCurrentQ,
    answers,
    submitted,
    score,
    showReview,
    setShowReview,
    assignmentSet,
    shuffledQuestions,
    questionOrder,
    showSuccessAlert,
    setShowSuccessAlert,
    showErrorAlert,
    setShowErrorAlert,
    alertMessage,
    handleSelect,
    handleSubmit,
    handleNewAttempt,
    navigate,
  } = logic;

  if (loading) return <Loading />;

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
  const answeredQuestions = answers.filter((a) => a !== null).length;
  const currentQuestion = shuffledQuestions[currentQ];

  return (
    <SecureAssessmentWrapper submitted={submitted}>
      <div className="assignment-quiz-main min-vh-100">
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
                    <span className="badge bg-info me-2">
                      Set {assignmentSet.setNumber}
                    </span>
                    <span className="badge bg-secondary">
                      Difficulty: {assignmentSet.difficulty}
                    </span>
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
                            variant={
                              answers[currentQ] === idx
                                ? "primary"
                                : "outline-primary"
                            }
                            className="text-start p-3 mb-2 w-100"
                            onClick={() => handleSelect(currentQ, idx)}
                            disabled={submitting}
                          >
                            <div className="d-flex align-items-center">
                              <div className="me-3">
                                {String.fromCharCode(65 + idx)}.
                              </div>
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
                      onClick={() => setCurrentQ((prev) => prev - 1)}
                      className="mb-2 mb-md-0"
                    >
                      Previous
                    </Button>

                    <div className="question-dots d-flex gap-2 mb-2 mb-md-0">
                      {Array(totalQuestions)
                        .fill(0)
                        .map((_, idx) => (
                          <button
                            key={idx}
                            className={`
                          question-dot 
                          ${idx === currentQ ? "active" : ""} 
                          ${answers[idx] !== null ? "answered" : ""}
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
                        disabled={answers.some((a) => a === null) || submitting}
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
                          "Submit"
                        )}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => setCurrentQ((prev) => prev + 1)}
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
                        {score}/
                        {assignmentSet.questions.reduce(
                          (acc, q) => acc + q.marks,
                          0
                        )}
                      </div>
                    </div>
                  </div>
                  <h5 className="mt-4 text-center">
                    {score ===
                    assignmentSet.questions.reduce((acc, q) => acc + q.marks, 0)
                      ? "Perfect Score! Assignment Complete!"
                      : "Assignment Submitted"}
                  </h5>
                  <div className="mt-3 text-center">
                    <Button
                      variant="primary"
                      onClick={() => setShowReview(!showReview)}
                      className="me-2"
                    >
                      {showReview ? "Hide Review" : "Show Review"}
                    </Button>
                    {score ===
                      assignmentSet.questions.reduce(
                        (acc, q) => acc + q.marks,
                        0
                      ) && (
                      <Button
                        variant="success"
                        onClick={() => navigate(`/courses/${id}`)}
                      >
                        Return to Course
                      </Button>
                    )}
                    {score <
                      assignmentSet.questions.reduce(
                        (acc, q) => acc + q.marks,
                        0
                      ) && (
                      <Button variant="success" onClick={handleNewAttempt}>
                        {assignmentSet &&
                        course.units[parseInt(unitIndex)].assignment
                          .assignmentSets.length === 1
                          ? "Retry Assignment"
                          : "Try Another Set"}
                      </Button>
                    )}
                  </div>

                  {showReview && (
                    <AssignmentReview
                      assignmentSet={assignmentSet}
                      answers={answers}
                      questionOrder={questionOrder}
                      score={score}
                      unitIndex={unitIndex}
                      course={course}
                      handleNewAttempt={handleNewAttempt}
                      navigate={navigate}
                      id={id}
                    />
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Container>
      </div>
    </SecureAssessmentWrapper>
  );
};

export default Assessment;