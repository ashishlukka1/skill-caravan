import { useEffect } from "react";
import { Container, Card, Button, Alert, Modal } from "react-bootstrap";
import { useSecureAssessment } from "./useSecureAssessment";

const SecureAssessmentWrapper = ({ children, submitted }) => {
  const {
    MAX_VIOLATIONS,
    assessmentStarted,
    setAssessmentStarted,
    violationCount,
    blocked,
    showViolationModal,
    setShowViolationModal,
    enterFullScreen,
    attemptsLeft,
    disableSecureMode,
  } = useSecureAssessment({ submitted });

  // FIX: Only call disableSecureMode in an effect, not during render
  useEffect(() => {
    if (submitted) {
      disableSecureMode && disableSecureMode();
    }
    // Only run when submitted changes
    // eslint-disable-next-line
  }, [submitted]);

  if (submitted) {
    return <>{children}</>;
  }

  if (blocked) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100">
        <h2 className="text-danger mb-3">Assessment Blocked</h2>
        <p className="text-center">
          You have tried to exit full screen or switch tabs more than{" "}
          {MAX_VIOLATIONS} times.
          <br />
          Please contact admin to retake the assessment.
        </p>
      </div>
    );
  }

  if (!assessmentStarted) {
    return (
      <Container className="py-5 mt-5 min-vh-100">
        <Card className="assignment-card text-center p-5">
          <Card.Body>
            <h3>Assessment Secure Mode</h3>
            <p>
              The assessment will start in full screen.
              <br />
              If you exit full screen or switch tabs more than {
                MAX_VIOLATIONS
              }{" "}
              times, you will be blocked and must contact admin to retake the
              assessment.
            </p>
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                enterFullScreen();
                setAssessmentStarted(true);
              }}
            >
              Start Assessment
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <>
      <Modal show={showViolationModal} backdrop="static" centered>
        <Modal.Header>
          <Modal.Title>Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            You have exited full screen or switched tabs.
            <br />
            Please return to full screen to continue your assessment.
          </p>
          <p>
            <strong>Attempts left: {attemptsLeft}</strong>
          </p>
          {attemptsLeft === 0 && (
            <Alert variant="danger" className="mt-2">
              You have reached the maximum number of violations. The assessment
              will be blocked.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          {attemptsLeft > 0 && (
            <Button
              variant="primary"
              onClick={() => {
                setShowViolationModal(false);
                enterFullScreen();
              }}
            >
              Return to Full Screen
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      {violationCount > 0 && !blocked && (
        <Alert variant="danger" className="text-center">
          Warning: You have {attemptsLeft} violation
          {attemptsLeft !== 1 ? "s" : ""} left before you are blocked.
        </Alert>
      )}
      {children}
    </>
  );
};

export default SecureAssessmentWrapper;