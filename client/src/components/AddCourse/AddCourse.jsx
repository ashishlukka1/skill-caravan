import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Form, Spinner, Row, Col, Container } from "react-bootstrap";
import axios from "../../utils/axios";
import AddCourseForm from "./AddCourseForm";
import UnitAccordion from "./UnitAccordion";
import TopRightAlert from "../../utils/TopRightAlert";
import "./AddCourse.css";

const defaultLesson = () => ({
  title: "",
  content: "",
  duration: ""+1,
});

const defaultQuestion = () => ({
  questionText: "",
  options: ["", "", "", ""],
  correctAnswer: "0",
  marks: 1,
});

const defaultAssignmentSet = () => ({
  title: "",
  description: "",
  difficulty: "easy",
  questions: [],
});

const defaultUnit = () => ({
  title: "",
  lessons: [],
  assignment: {
    assignmentSets: [],
  },
});

const AddCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [course, setCourse] = useState({
    title: "",
    description: "",
    category: "Web Development",
    difficulty: "Beginner",
    thumbnail: "",
    duration: 0,
    tags: [],
    isDefault: false,
    units: [],
  });

  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCourseThumbnailChange = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setCourse((prev) => ({
        ...prev,
        thumbnail: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleAddUnit = () => {
    setCourse((prev) => ({
      ...prev,
      units: [...prev.units, defaultUnit()],
    }));
  };

  const handleRemoveUnit = (unitIndex) => {
    setCourse((prev) => ({
      ...prev,
      units: prev.units.filter((_, idx) => idx !== unitIndex),
    }));
  };

  const handleUnitChange = (unitIndex, field, value) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex][field] = value;
      return { ...prev, units: updatedUnits };
    });
  };

  const handleAddLesson = (unitIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].lessons.push(defaultLesson());
      return { ...prev, units: updatedUnits };
    });
  };

  const handleRemoveLesson = (unitIndex, lessonIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].lessons = updatedUnits[unitIndex].lessons.filter(
        (_, idx) => idx !== lessonIndex
      );
      return { ...prev, units: updatedUnits };
    });
  };

  const handleLessonChange = (unitIndex, lessonIndex, field, value) => {
  setCourse((prev) => {
    const updatedUnits = [...prev.units];
    updatedUnits[unitIndex].lessons[lessonIndex][field] =
      field === "duration" ? Number(value) : value;
    return { ...prev, units: updatedUnits };
  });
};

  const handleAddAssignmentSet = (unitIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].assignment.assignmentSets.push(
        defaultAssignmentSet()
      );
      return { ...prev, units: updatedUnits };
    });
  };

  const handleRemoveAssignmentSet = (unitIndex, setIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].assignment.assignmentSets = updatedUnits[
        unitIndex
      ].assignment.assignmentSets.filter((_, idx) => idx !== setIndex);
      return { ...prev, units: updatedUnits };
    });
  };

  const handleAssignmentSetChange = (unitIndex, setIndex, field, value) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].assignment.assignmentSets[setIndex][field] =
        value;
      return { ...prev, units: updatedUnits };
    });
  };

  const handleAddQuestion = (unitIndex, setIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].assignment.assignmentSets[
        setIndex
      ].questions.push(defaultQuestion());
      return { ...prev, units: updatedUnits };
    });
  };

  const handleRemoveQuestion = (unitIndex, qIdx, setIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].assignment.assignmentSets[setIndex].questions =
        updatedUnits[unitIndex].assignment.assignmentSets[
          setIndex
        ].questions.filter((_, idx) => idx !== qIdx);
      return { ...prev, units: updatedUnits };
    });
  };

  const handleQuestionChange = (unitIndex, qIdx, field, value, setIndex) => {
    setCourse((prev) => {
      const updatedUnits = [...prev.units];
      updatedUnits[unitIndex].assignment.assignmentSets[setIndex].questions[
        qIdx
      ][field] = value;
      return { ...prev, units: updatedUnits };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlertMessage("");
    try {
      const res = await axios.post("/api/courses", course);
      if (res.status === 201 || res.status === 200) {
        setAlertMessage("Course created successfully!");
        setShowSuccessAlert(true);
        setTimeout(() => navigate(`/courses`), 1500);
      } else {
        throw new Error("Failed to create course.");
      }
    } catch (err) {
      setAlertMessage(
        err.response?.data?.message ||
          "Failed to create course. Please check all fields."
      );
      setShowErrorAlert(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5 mt-5">
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
      <h2 className="mb-4 text-center">Add New Course</h2>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          <Form onSubmit={handleSubmit}>
            <AddCourseForm
              course={course}
              setCourse={setCourse}
              handleBasicInfoChange={handleBasicInfoChange}
              handleCourseThumbnailChange={handleCourseThumbnailChange}
            />
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
                    Creating...
                  </>
                ) : (
                  "Create Course"
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default AddCourse;
