import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "../../utils/axios";
import {
  Button,
  Form,
  Spinner,
  Card,
  Badge,
  Alert,
  Row,
  Col,
  Container,
  Accordion,
} from "react-bootstrap";
import { FaPlus, FaTrash, FaFileAlt } from "react-icons/fa";
import "./EditCourseById.css";
import "../Certificates/AddCertificate";

const ResourceForm = ({ unitIndex, lessonIndex, onSubmit, onCancel }) => {
  const [type, setType] = useState("video_url");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResourceSubmit = async () => {
    if (
      !title ||
      (type === "video_url" && !url) ||
      (type !== "video_url" && !file)
    ) {
      alert("Please fill all required fields.");
      return;
    }
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("type", type);
      formData.append("title", title);
      if (type === "video_url") {
        formData.append("url", url);
      } else {
        formData.append("file", file);
      }
      await onSubmit(unitIndex, lessonIndex, formData);
      setTitle("");
      setUrl("");
      setFile(null);
      setType("video_url");
      onCancel();
    } catch (err) {
      alert("Failed to upload resource");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="resource-form p-3 border rounded bg-light mb-3">
      <Row>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Resource Type</Form.Label>
            <Form.Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="video_url">Video URL</option>
              <option value="video_file">Video File</option>
              <option value="document">Document</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter resource title"
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          {type === "video_url" ? (
            <Form.Group>
              <Form.Label>Video URL</Form.Label>
              <Form.Control
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter video URL"
                required
              />
            </Form.Group>
          ) : (
            <Form.Group>
              <Form.Label>File</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setFile(e.target.files[0])}
                accept={
                  type === "video_file"
                    ? "video/*"
                    : "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                }
                required
              />
            </Form.Group>
          )}
        </Col>
      </Row>
      <div className="d-flex gap-2 mt-3">
        <Button
          type="button"
          variant="primary"
          disabled={isSubmitting}
          onClick={handleResourceSubmit}
        >
          {isSubmitting ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Uploading...
            </>
          ) : (
            "Add Resource"
          )}
        </Button>
        <Button
          type="button"
          variant="outline-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

const EditCourseById = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [course, setCourse] = useState(null);
  const [showResourceForm, setShowResourceForm] = useState({
    unit: null,
    lesson: null,
  });
  const [uploadingResource, setUploadingResource] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${id}`);
        const courseData = response.data;
        setCourse({
          ...courseData,
          tags: courseData.tags || [],
          units: (courseData.units || []).map((unit) => ({
            ...unit,
            lessons: (unit.lessons || []).map((lesson) => ({
              ...lesson,
              resources: lesson.resources || [],
            })),
            assignment: unit.assignment || { assignmentSets: [] },
          })),
        });
      } catch (err) {
        setError("Error loading course");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  // --- Basic Info Change ---
  const handleBasicInfoChange = (e) => {
    const { name, value } = e.target;
    setCourse((prev) => ({
      ...prev,
      [name]: name === "tags" ? value.split(",").map((t) => t.trim()) : value,
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
      updated.units.splice(index, 1);
      return updated;
    });
  };

  const handleUnitChange = (unitIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex][field] = value;
      return updated;
    });
  };

  // --- Lesson Management ---
  const handleAddLesson = (unitIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].lessons.push({
        title: "",
        content: "",
        videoUrl: "",
        duration: 0,
        resources: [],
      });
      return updated;
    });
  };

  const handleRemoveLesson = (unitIndex, lessonIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].lessons.splice(lessonIndex, 1);
      return updated;
    });
  };

  const handleLessonChange = (unitIndex, lessonIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].lessons[lessonIndex][field] = value;
      return updated;
    });
  };

  // --- Assignment Set Management ---
  const handleAddAssignmentSet = (unitIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].assignment.assignmentSets.push({
        setNumber:
          updated.units[unitIndex].assignment.assignmentSets.length + 1,
        title: "",
        description: "",
        difficulty: "easy",
        questions: [],
      });
      return updated;
    });
  };

  const handleRemoveAssignmentSet = (unitIndex, setIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].assignment.assignmentSets.splice(setIndex, 1);
      return updated;
    });
  };

  const handleAssignmentSetChange = (unitIndex, setIndex, field, value) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].assignment.assignmentSets[setIndex][field] =
        value;
      return updated;
    });
  };

  // --- Question Management ---
  const handleAddQuestion = (unitIndex, setIndex = null) => {
    setCourse((prev) => {
      const updated = { ...prev };
      if (setIndex !== null) {
        updated.units[unitIndex].assignment.assignmentSets[
          setIndex
        ].questions.push({
          questionText: "",
          options: ["", "", "", ""],
          correctAnswer: "0",
          marks: 1,
        });
      }
      return updated;
    });
  };

  const handleRemoveQuestion = (unitIndex, questionIndex, setIndex = null) => {
    setCourse((prev) => {
      const updated = { ...prev };
      if (setIndex !== null) {
        updated.units[unitIndex].assignment.assignmentSets[
          setIndex
        ].questions.splice(questionIndex, 1);
      }
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
      if (setIndex !== null) {
        updated.units[unitIndex].assignment.assignmentSets[setIndex].questions[
          questionIndex
        ][field] = value;
      }
      return updated;
    });
  };

  // --- Resource Upload ---
  const handleResourceAdd = async (unitIndex, lessonIndex, formData) => {
    try {
      setUploadingResource(true);
      const response = await axios.post(
        `/api/courses/${id}/units/${unitIndex}/lessons/${lessonIndex}/resources`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setCourse((prev) => {
        const updated = { ...prev };
        if (!updated.units[unitIndex].lessons[lessonIndex].resources) {
          updated.units[unitIndex].lessons[lessonIndex].resources = [];
        }
        updated.units[unitIndex].lessons[lessonIndex].resources.push(
          response.data.resource
        );
        return updated;
      });
      setShowResourceForm({ unit: null, lesson: null });
      return response.data;
    } catch (err) {
      alert("Failed to upload resource");
      throw err;
    } finally {
      setUploadingResource(false);
    }
  };

  const handleRemoveResource = (unitIndex, lessonIndex, resourceIndex) => {
    setCourse((prev) => {
      const updated = { ...prev };
      updated.units[unitIndex].lessons[lessonIndex].resources.splice(
        resourceIndex,
        1
      );
      return updated;
    });
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    try {
      // Calculate total duration
      const totalDuration = (course.units || []).reduce((total, unit) => {
        return (
          total +
          (unit.lessons || []).reduce(
            (sum, lesson) => sum + (parseInt(lesson.duration) || 0),
            0
          )
        );
      }, 0);

      // Prepare update data
      const updateData = {
        ...course,
        duration: totalDuration,
        units: (course.units || []).map((unit) => ({
          ...unit,
          lessons: (unit.lessons || []).map((lesson) => ({
            ...lesson,
            duration: parseInt(lesson.duration) || 0,
          })),
          assignment: {
            assignmentSets: (unit.assignment?.assignmentSets || []).map(
              (set, idx) => ({
                setNumber: idx + 1,
                title: set.title,
                description: set.description,
                difficulty: set.difficulty,
                questions: (set.questions || []).map((q) => ({
                  questionText: q.questionText,
                  options: (q.options || []).filter((opt) => opt.trim()),
                  correctAnswer: q.correctAnswer,
                  marks: parseInt(q.marks) || 1,
                })),
              })
            ),
          },
        })),
      };

      await axios.put(`/api/courses/${id}`, updateData);

      setSuccess("Course updated successfully!");
      setTimeout(() => {
        navigate("/edit-courses");
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Error updating course");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
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
    <Container className="py-4">
      <h2 className="mb-4 text-center">Edit Course</h2>
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
                            tags: e.target.value.split(",").map((t) => t.trim()),
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
                        navigate(`/edit-courses/${id}/certificate-upload`)
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
                      navigate(`/edit-courses/${id}/certificate-upload`)
                    }
                  >
                    Add Certificate to the Course
                  </Button>
                )}
              </Card.Body>
            </Card>

            {/* Units and Lessons */}
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
                          <Form.Label>Unit Title</Form.Label>
                          <Form.Control
                            value={unit.title}
                            onChange={(e) =>
                              handleUnitChange(unitIndex, "title", e.target.value)
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
                            {/* Resources Section */}
                            <div className="resources-section">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6>Resources</h6>
                                {showResourceForm.unit !== unitIndex ||
                                showResourceForm.lesson !== lessonIndex ? (
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() =>
                                      setShowResourceForm({
                                        unit: unitIndex,
                                        lesson: lessonIndex,
                                      })
                                    }
                                    disabled={uploadingResource}
                                  >
                                    <FaPlus className="me-1" /> Add Resource
                                  </Button>
                                ) : null}
                              </div>
                              {(lesson.resources || []).length > 0 ? (
                                <div className="resources-list">
                                  {lesson.resources.map((resource, resourceIndex) => (
                                    <div
                                      key={resourceIndex}
                                      className="resource-item d-flex align-items-center mb-2"
                                    >
                                      <Badge
                                        bg={
                                          resource.type === "video_url"
                                            ? "primary"
                                            : "secondary"
                                        }
                                      >
                                        {resource.type === "video_url"
                                          ? "Video URL"
                                          : resource.type === "video_file"
                                          ? "Video File"
                                          : "Document"}
                                      </Badge>
                                      <span className="resource-title ms-2">
                                        {resource.title || ""}
                                      </span>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        className="btn-remove ms-2"
                                        onClick={() =>
                                          handleRemoveResource(
                                            unitIndex,
                                            lessonIndex,
                                            resourceIndex
                                          )
                                        }
                                      >
                                        <FaTrash />
                                      </Button>
                                      {resource.url && (
                                        <a
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="ms-2"
                                        >
                                          <FaFileAlt />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="resources-empty">
                                  <FaFileAlt className="mb-2" size={24} />
                                  <p className="mb-0">No resources added yet</p>
                                </div>
                              )}
                              {showResourceForm.unit === unitIndex &&
                                showResourceForm.lesson === lessonIndex && (
                                  <ResourceForm
                                    unitIndex={unitIndex}
                                    lessonIndex={lessonIndex}
                                    onSubmit={handleResourceAdd}
                                    onCancel={() =>
                                      setShowResourceForm({ unit: null, lesson: null })
                                    }
                                  />
                                )}
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
                                      handleRemoveAssignmentSet(unitIndex, setIndex)
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
                                        ? q.questionText.slice(0, 30) + (q.questionText.length > 30 ? "..." : "")
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
                                        <Form.Group className="mb-2" key={optIdx}>
                                          <Form.Control
                                            value={opt}
                                            onChange={(e) => {
                                              const newOptions = [...q.options];
                                              newOptions[optIdx] = e.target.value;
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
                                        <Form.Label>Correct Answer (option number)</Form.Label>
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
                                            handleRemoveQuestion(unitIndex, qIdx, setIndex)
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
                                  onClick={() => handleAddQuestion(unitIndex, setIndex)}
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
              <Button type="submit" variant="primary" disabled={loading} size="lg">
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
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export  default EditCourseById;