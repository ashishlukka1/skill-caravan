import {
  Button,
  Form,
  Spinner,
  Alert,
  Row,
  Col,
  Container,
} from "react-bootstrap";
import TopRightAlert from "../../utils/TopRightAlert";
import ResourceModal from "../../utils/ResourceModal";
import AddCourseForm from "../AddCourse/AddCourseForm";
import UnitAccordion from "../AddCourse/UnitAccordion";
import ResourceSection from "./ResourceSection";
import { useEditCourseById } from "./EditCourseById.handlers";
import Loading from '../../utils/Loading'

const EditCourseById = () => {
  const {
    loading,
    error,
    success,
    course,
    setCourse,
    showResourceForm,
    setShowResourceForm,
    uploadingResource,
    selectedResource,
    setSelectedResource,
    showResourceModal,
    setShowResourceModal,
    showSuccessAlert,
    setShowSuccessAlert,
    showErrorAlert,
    setShowErrorAlert,
    alertMessage,
    handleBasicInfoChange,
    handleCourseThumbnailChange,
    handleAddUnit,
    handleRemoveUnit,
    handleUnitChange,
    handleAddLesson,
    handleRemoveLesson,
    handleLessonChange,
    handleAddAssignmentSet,
    handleRemoveAssignmentSet,
    handleAssignmentSetChange,
    handleAddQuestion,
    handleRemoveQuestion,
    handleQuestionChange,
    handleResourceAdd,
    handleRemoveResource,
    handleResourceClick,
    handleSubmit,
  } = useEditCourseById();

  // Inject resource section into each lesson
  const renderLessonResources = (unitIndex, lessonIndex, lesson) => (
    <ResourceSection
      unitIndex={unitIndex}
      lessonIndex={lessonIndex}
      lesson={lesson}
      showResourceForm={showResourceForm}
      setShowResourceForm={setShowResourceForm}
      uploadingResource={uploadingResource}
      handleResourceAdd={handleResourceAdd}
      handleRemoveResource={handleRemoveResource}
      handleResourceClick={handleResourceClick}
    />
  );

  if (loading) {
    return <Loading message="Loading course..." />;
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
            <AddCourseForm
              course={course}
              setCourse={setCourse}
              handleBasicInfoChange={handleBasicInfoChange}
              handleCourseThumbnailChange={handleCourseThumbnailChange}
            />
            {/* Certificate and Recurring */}
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
                    window.location.assign(
                      `/edit-courses/${course._id}/certificate-upload`
                    )
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
                  window.location.assign(
                    `/edit-courses/${course._id}/certificate-upload`
                  )
                }
              >
                Add Certificate to the Course
              </Button>
            )}
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Make this course recurring"
                checked={course.isRecurring}
                onChange={(e) =>
                  setCourse((prev) => ({
                    ...prev,
                    isRecurring: e.target.checked,
                  }))
                }
              />
              {course.isRecurring && (
                <Form.Control
                  type="datetime-local"
                  value={
                    course.recurringNextDate
                      ? (() => {
                          const d = new Date(course.recurringNextDate);
                          d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                          return d.toISOString().slice(0, 16);
                        })()
                      : ""
                  }
                  onChange={(e) => {
                    const local = e.target.value;
                    setCourse((prev) => ({
                      ...prev,
                      recurringNextDate: local
                        ? new Date(local).toISOString()
                        : "",
                    }));
                  }}
                  placeholder="Next recurring date & time"
                  className="mt-2"
                  required
                />
              )}
            </Form.Group>
            {/* Units/Lessons/Assignments with resource injection */}
            <UnitAccordion
              units={course.units}
              handleAddUnit={handleAddUnit}
              handleRemoveUnit={handleRemoveUnit}
              handleUnitChange={handleUnitChange}
              handleAddLesson={handleAddLesson}
              handleRemoveLesson={handleRemoveLesson}
              handleLessonChange={handleLessonChange}
              handleAddAssignmentSet={handleAddAssignmentSet}
              handleRemoveAssignmentSet={handleRemoveAssignmentSet}
              handleAssignmentSetChange={handleAssignmentSetChange}
              handleAddQuestion={handleAddQuestion}
              handleRemoveQuestion={handleRemoveQuestion}
              handleQuestionChange={handleQuestionChange}
              renderLessonExtra={renderLessonResources}
            />
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
