import { Card, Badge, Alert, Button } from "react-bootstrap";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const AssessmentReview = ({
  assignmentSet,
  answers,
  questionOrder,
  score,
  unitIndex,
  course,
  handleNewAttempt,
  navigate,
  id,
}) => {
  const totalMarks = assignmentSet.questions.reduce(
    (acc, q) => acc + q.marks,
    0
  );

  return (
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
                {
                  assignmentSet.questions.filter(
                    (q, idx) =>
                      answers[questionOrder.indexOf(idx)] ===
                      parseInt(q.correctAnswer)
                  ).length
                }
              </span>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <span>Score Achieved:</span>
              <span
                className={
                  score === totalMarks ? "text-success" : "text-warning"
                }
              >
                {((score / totalMarks) * 100).toFixed(1)}%
              </span>
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="questions-review">
        {assignmentSet.questions.map((question, originalIdx) => {
          const shuffledIdx = questionOrder.indexOf(originalIdx);
          const userAnswer = answers[shuffledIdx];
          const isCorrect = userAnswer === parseInt(question.correctAnswer);

          return (
            <Card
              key={originalIdx}
              className={`question-review-card mb-4 ${
                isCorrect ? "border-success" : "border-danger"
              }`}
            >
              <Card.Header className="d-flex justify-content-between align-items-center">
                <span>Question {originalIdx + 1}</span>
                <Badge bg={isCorrect ? "success" : "danger"}>
                  {isCorrect ? (
                    <>
                      <FaCheckCircle className="me-1" /> {question.marks} marks
                    </>
                  ) : (
                    <>
                      <FaTimes className="me-1" /> 0/{question.marks} marks
                    </>
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
                        ${optIdx === userAnswer ? "selected" : ""}
                        ${
                          optIdx === parseInt(question.correctAnswer)
                            ? "correct"
                            : ""
                        }
                        ${
                          optIdx === userAnswer && !isCorrect ? "incorrect" : ""
                        }
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
                    The correct answer was:{" "}
                    {question.options[parseInt(question.correctAnswer)]}
                  </Alert>
                )}
              </Card.Body>
            </Card>
          );
        })}
      </div>

      <div className="review-actions mt-4 text-center">
        {score < totalMarks ? (
          <Alert variant="warning">
            You need a perfect score to complete this unit.{" "}
            {assignmentSet &&
            course.units[parseInt(unitIndex)].assignment.assignmentSets
              .length === 1
              ? "Retry the assignment until you achieve a perfect score."
              : "Try another set!"}
          </Alert>
        ) : (
          <Alert variant="success">
            Congratulations! You've completed this unit's assignment!
          </Alert>
        )}

        <Button
          variant={score === totalMarks ? "success" : "primary"}
          onClick={() => {
            if (score === totalMarks) {
              navigate(`/courses/${id}`);
            } else {
              handleNewAttempt();
            }
          }}
          className="mt-3"
        >
          {score === totalMarks
            ? "Return to Course"
            : assignmentSet &&
              course.units[parseInt(unitIndex)].assignment.assignmentSets
                .length === 1
            ? "Retry Assignment"
            : "Try Another Set"}
        </Button>
      </div>
    </div>
  );
};

export default AssessmentReview;