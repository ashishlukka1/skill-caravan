import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import {
  Button,
  Form,
  Spinner,
  Card,
  Alert,
  Row,
  Col,
  Container,
  Accordion,
} from "react-bootstrap";
import { FaPlus, FaTrash, FaFileAlt } from "react-icons/fa";
import { fileToBase64 } from "../../utils/fileBase64";
import "./AddCourse.css";

const AddCourse = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [course, setCourse] = useState({
    title: "",
    description: "",
    category: "Web Development",
    difficulty: "Beginner",
    thumbnail: "",
    duration: 0,
    tags: [],
    units: [],
  });

  // --- Basic Info Change ---
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- Thumbnail Upload for Course ---
  const handleCourseThumbnailChange = async (file) => {
    if (!file) return;
    const base64 = await fileToBase64(file);
    setCourse((prev) => ({
      ...prev,
      thumbnail: base64,
    }));
  };

  // --- Unit Management ---
  const handleAddUnit = () => {
    setCourse((prev) => ({
      ...prev,
      units: [
        ...prev.units,
        {
          title: "",
          lessons: [],
          assignment: { assignmentSets: [] },
        },
      ],
    }));
  };

  const handleRemoveUnit = (index) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.filter((_, i) => i !== index);
      return updated;
    });
  };

  const handleUnitChange = (unitIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex ? { ...unit, [field]: value } : unit
      );
      return updated;
    });
  };

  // --- Lesson Management ---
  const handleAddLesson = (unitIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: [
                ...unit.lessons,
                {
                  title: "",
                  content: "",
                  duration: 0,
                  resources: [],
                },
              ],
            }
          : unit
      );
      return updated;
    });
  };

  const handleRemoveLesson = (unitIndex, lessonIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.filter((_, i) => i !== lessonIndex),
            }
          : unit
      );
      return updated;
    });
  };

  const handleLessonChange = (unitIndex, lessonIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              lessons: unit.lessons.map((lesson, lidx) =>
                lidx === lessonIndex ? { ...lesson, [field]: value } : lesson
              ),
            }
          : unit
      );
      return updated;
    });
  };

  // --- Assignment Set Management ---
  const handleAddAssignmentSet = (unitIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: [
                  ...unit.assignment.assignmentSets,
                  {
                    setNumber: unit.assignment.assignmentSets.length + 1,
                    title: "",
                    description: "",
                    difficulty: "easy",
                    questions: [],
                  },
                ],
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleRemoveAssignmentSet = (unitIndex, setIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.filter(
                  (_, i) => i !== setIndex
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleAssignmentSetChange = (unitIndex, setIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex ? { ...set, [field]: value } : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  // --- Question Management ---
  const handleAddQuestion = (unitIndex, setIndex = null) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: [
                            ...set.questions,
                            {
                              questionText: "",
                              options: ["", "", "", ""],
                              correctAnswer: "0",
                              marks: 1,
                            },
                          ],
                        }
                      : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleRemoveQuestion = (unitIndex, questionIndex, setIndex = null) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: set.questions.filter(
                            (_, qidx) => qidx !== questionIndex
                          ),
                        }
                      : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  const handleQuestionChange = (
    unitIndex,
    questionIndex,
    field,
    value,
    setIndex = null
  ) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units = updated.units.map((unit, idx) =>
        idx === unitIndex
          ? {
              ...unit,
              assignment: {
                ...unit.assignment,
                assignmentSets: unit.assignment.assignmentSets.map(
                  (set, sidx) =>
                    sidx === setIndex
                      ? {
                          ...set,
                          questions: set.questions.map((q, qidx) =>
                            qidx === questionIndex
                              ? { ...q, [field]: value }
                              : q
                          ),
                        }
                      : set
                ),
              },
            }
          : unit
      );
      return updated;
    });
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // POST to backend
      const response = await axios.post("/api/courses", course);
      setSuccess("Course created successfully!");
      setTimeout(() => {
        navigate(`/courses`);
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to create course. Please check all fields."
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <Container className="py-5 mt-5">
      <h2 className="mb-4 text-center">Add New Course</h2>
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          {error && <Alert variant="danger">{error}</Alert>}
          {success && <Alert variant="success">{success}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Card className="mb-4 shadow-sm">
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Title</Form.Label>
                      <Form.Control
                        name="title"
                        value={course.title}
                        onChange={handleBasicInfoChange}
                        required
                        placeholder="Course Title"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Category</Form.Label>
                      <Form.Select
                        name="category"
                        value={course.category}
                        onChange={handleBasicInfoChange}
                      >
                        <option>Web Development</option>
                        <option>Data Science</option>
                        <option>AI/ML</option>
                        <option>Cloud</option>
                        <option>Cybersecurity</option>
                        <option>Finance</option>
                        <option>HR</option>
                        <option>Marketing</option>
                        <option>DevOps</option>
                        <option>Design</option>
                        <option>Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Difficulty</Form.Label>
                      <Form.Select
                        name="difficulty"
                        value={course.difficulty}
                        onChange={handleBasicInfoChange}
                      >
                        <option>Beginner</option>
                        <option>Intermediate</option>
                        <option>Advanced</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags (comma separated)</Form.Label>
                      <Form.Control
                        name="tags"
                        value={course.tags.join(",")}
                        onChange={(e) =>
                          setCourse((prev) => ({
                            ...prev,
                            tags: e.target.value
                              .split(",")
                              .map((t) => t.trim()),
                          }))
                        }
                        placeholder="e.g. javascript, react, backend"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={course.description}
                    onChange={handleBasicInfoChange}
                    required
                    rows={3}
                    placeholder="Course Description"
                  />
                </Form.Group>
                {/* Course Thumbnail */}
                <Form.Group className="mb-3">
                  <Form.Label>Course Thumbnail</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleCourseThumbnailChange(e.target.files[0])
                    }
                  />
                  {course.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={course.thumbnail}
                        alt="Course Thumbnail"
                        style={{ maxWidth: "200px", maxHeight: "120px" }}
                      />
                    </div>
                  )}
                </Form.Group>
              </Card.Body>
            </Card>

            {/*    and Lessons */}
            <h4 className="mb-3">Units</h4>
            <Accordion defaultActiveKey={course.units.length ? "0" : undefined}>
              {course.units.map((unit, unitIndex) => (
                <Accordion.Item eventKey={unitIndex.toString()} key={unitIndex}>
                  <Accordion.Header>
                    <span className="fw-semibold">
                      {unit.title || `Unit ${unitIndex + 1}`}
                    </span>
                  </Accordion.Header>
                  <Accordion.Body>
                    <Row className="align-items-center mb-3">
                      <Col md={10}>
                        <Form.Group>
                          <h5 className="mt-3 mb-2">Unit Title</h5>
                          <Form.Control
                            value={unit.title}
                            onChange={(e) =>
                              handleUnitChange(
                                unitIndex,
                                "title",
                                e.target.value
                              )
                            }
                            required
                            placeholder="Unit Title"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={2} className="text-end">
                        <Button
                          variant="outline-danger"
                          onClick={() => handleRemoveUnit(unitIndex)}
                          size="sm"
                        >
                          <FaTrash />
                        </Button>
                      </Col>
                    </Row>
                    <h5 className="mt-3 mb-2">Lessons</h5>
                    <Accordion alwaysOpen>
                      {unit.lessons.map((lesson, lessonIndex) => (
                        <Accordion.Item
                          eventKey={`lesson-${unitIndex}-${lessonIndex}`}
                          key={lessonIndex}
                        >
                          <Accordion.Header>
                            {lesson.title || `Lesson ${lessonIndex + 1}`}
                          </Accordion.Header>
                          <Accordion.Body>
                            <Row className="align-items-center mb-2">
                              <Col md={10}>
                                <Form.Group>
                                  <Form.Label>Lesson Title</Form.Label>
                                  <Form.Control
                                    value={lesson.title}
                                    onChange={(e) =>
                                      handleLessonChange(
                                        unitIndex,
                                        lessonIndex,
                                        "title",
                                        e.target.value
                                      )
                                    }
                                    required
                                    placeholder="Lesson Title"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={2} className="text-end">
                                <Button
                                  variant="outline-danger"
                                  onClick={() =>
                                    handleRemoveLesson(unitIndex, lessonIndex)
                                  }
                                  size="sm"
                                >
                                  <FaTrash />
                                </Button>
                              </Col>
                            </Row>
                            <Form.Group className="mb-2">
                              <Form.Label>Content</Form.Label>
                              <Form.Control
                                as="textarea"
                                value={lesson.content}
                                onChange={(e) =>
                                  handleLessonChange(
                                    unitIndex,
                                    lessonIndex,
                                    "content",
                                    e.target.value
                                  )
                                }
                                rows={2}
                                placeholder="Lesson Content"
                              />
                            </Form.Group>
                            <Form.Group className="mb-2">
                              <Form.Label>Duration (minutes)</Form.Label>
                              <Form.Control
                                type="number"
                                value={lesson.duration}
                                onChange={(e) =>
                                  handleLessonChange(
                                    unitIndex,
                                    lessonIndex,
                                    "duration",
                                    e.target.value
                                  )
                                }
                                min={0}
                                placeholder="Duration"
                              />
                            </Form.Group>
                            <div className="resources-section">
                              <div className="alert alert-warning mb-0">
                                <FaFileAlt className="mb-2" size={18} /> Please
                                create the course first, then add resources to
                                lessons from the Edit Course page.
                              </div>
                            </div>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                    </Accordion>
                    <div className="my-2 text-end">
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => handleAddLesson(unitIndex)}
                      >
                        <FaPlus className="me-1" /> Add Lesson
                      </Button>
                    </div>
                    {/* Assignment Sets */}
                    <div className="mt-4">
                      <h5 className="mb-2">Assignment Sets</h5>
                      <Accordion alwaysOpen>
                        {unit.assignment.assignmentSets.map((set, setIndex) => (
                          <Accordion.Item
                            eventKey={`set-${unitIndex}-${setIndex}`}
                            key={setIndex}
                          >
                            <Accordion.Header>
                              {set.title || `Set ${setIndex + 1}`}
                            </Accordion.Header>
                            <Accordion.Body>
                              <Row className="align-items-center mb-2">
                                <Col md={10}>
                                  <Form.Group>
                                    <Form.Label>Set Title</Form.Label>
                                    <Form.Control
                                      value={set.title}
                                      onChange={(e) =>
                                        handleAssignmentSetChange(
                                          unitIndex,
                                          setIndex,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      required
                                      placeholder="Assignment Set Title"
                                    />
                                  </Form.Group>
                                </Col>
                                <Col md={2} className="text-end">
                                  <Button
                                    variant="outline-danger"
                                    onClick={() =>
                                      handleRemoveAssignmentSet(
                                        unitIndex,
                                        setIndex
                                      )
                                    }
                                    size="sm"
                                  >
                                    <FaTrash />
                                  </Button>
                                </Col>
                              </Row>
                              <Form.Group className="mb-2">
                                <Form.Label>Description</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  value={set.description}
                                  onChange={(e) =>
                                    handleAssignmentSetChange(
                                      unitIndex,
                                      setIndex,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                  placeholder="Assignment Set Description"
                                />
                              </Form.Group>
                              <Form.Group className="mb-2">
                                <Form.Label>Difficulty</Form.Label>
                                <Form.Select
                                  value={set.difficulty}
                                  onChange={(e) =>
                                    handleAssignmentSetChange(
                                      unitIndex,
                                      setIndex,
                                      "difficulty",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="easy">Easy</option>
                                  <option value="medium">Medium</option>
                                  <option value="hard">Hard</option>
                                </Form.Select>
                              </Form.Group>
                              <h6 className="mt-3 mb-2">Questions</h6>
                              <Accordion alwaysOpen>
                                {set.questions.map((q, qIdx) => (
                                  <Accordion.Item
                                    eventKey={`q-${unitIndex}-${setIndex}-${qIdx}`}
                                    key={qIdx}
                                  >
                                    <Accordion.Header>
                                      {q.questionText
                                        ? q.questionText.slice(0, 30) +
                                          (q.questionText.length > 30
                                            ? "..."
                                            : "")
                                        : `Question ${qIdx + 1}`}
                                    </Accordion.Header>
                                    <Accordion.Body>
                                      <Form.Group className="mb-2">
                                        <Form.Label>Question Text</Form.Label>
                                        <Form.Control
                                          value={q.questionText}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              unitIndex,
                                              qIdx,
                                              "questionText",
                                              e.target.value,
                                              setIndex
                                            )
                                          }
                                          required
                                          placeholder="Question"
                                        />
                                      </Form.Group>
                                      <Form.Label>Options</Form.Label>
                                      {q.options.map((opt, optIdx) => (
                                        <Form.Group
                                          className="mb-2"
                                          key={optIdx}
                                        >
                                          <Form.Control
                                            value={opt}
                                            onChange={(e) => {
                                              const newOptions = [...q.options];
                                              newOptions[optIdx] =
                                                e.target.value;
                                              handleQuestionChange(
                                                unitIndex,
                                                qIdx,
                                                "options",
                                                newOptions,
                                                setIndex
                                              );
                                            }}
                                            placeholder={`Option ${optIdx + 1}`}
                                            required
                                          />
                                        </Form.Group>
                                      ))}
                                      <Form.Group className="mb-2">
                                        <Form.Label>
                                          Correct Answer (option number)
                                        </Form.Label>
                                        <Form.Select
                                          value={q.correctAnswer}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              unitIndex,
                                              qIdx,
                                              "correctAnswer",
                                              e.target.value,
                                              setIndex
                                            )
                                          }
                                        >
                                          {q.options.map((_, idx) => (
                                            <option key={idx} value={idx}>
                                              {`Option ${idx + 1}`}
                                            </option>
                                          ))}
                                        </Form.Select>
                                      </Form.Group>
                                      <Form.Group className="mb-2">
                                        <Form.Label>Marks</Form.Label>
                                        <Form.Control
                                          type="number"
                                          value={q.marks}
                                          onChange={(e) =>
                                            handleQuestionChange(
                                              unitIndex,
                                              qIdx,
                                              "marks",
                                              e.target.value,
                                              setIndex
                                            )
                                          }
                                          min={1}
                                          required
                                          placeholder="Marks"
                                        />
                                      </Form.Group>
                                      <div className="text-end">
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() =>
                                            handleRemoveQuestion(
                                              unitIndex,
                                              qIdx,
                                              setIndex
                                            )
                                          }
                                        >
                                          <FaTrash /> Remove Question
                                        </Button>
                                      </div>
                                    </Accordion.Body>
                                  </Accordion.Item>
                                ))}
                              </Accordion>
                              <div className="my-2 text-end">
                                <Button
                                  variant="outline-success"
                                  size="sm"
                                  onClick={() =>
                                    handleAddQuestion(unitIndex, setIndex)
                                  }
                                >
                                  <FaPlus className="me-1" /> Add Question
                                </Button>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        ))}
                      </Accordion>
                      <div className="my-2 text-end">
                        <Button
                          variant="outline-success"
                          size="sm"
                          onClick={() => handleAddAssignmentSet(unitIndex)}
                        >
                          <FaPlus className="me-1" /> Add Assignment Set
                        </Button>
                      </div>
                    </div>
                  </Accordion.Body>
                </Accordion.Item>
              ))}
            </Accordion>
            <div className="my-3 text-end">
              <Button variant="outline-success" onClick={handleAddUnit}>
                <FaPlus className="me-1" /> Add Unit
              </Button>
            </div>
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