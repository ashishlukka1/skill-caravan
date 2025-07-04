import { Accordion, Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

const LessonItem = ({
  lesson,
  lessonIndex,
  unitIndex,
  handleRemoveLesson,
  handleLessonChange,
  renderLessonExtra,
  readOnly, // <-- add this prop
}) => (
  <Accordion.Item eventKey={`lesson-${unitIndex}-${lessonIndex}`}>
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
              disabled={readOnly}
            />
          </Form.Group>
        </Col>
        <Col md={2} className="text-end">
          {!readOnly && (
            <Button
              variant="outline-danger"
              onClick={() => handleRemoveLesson(unitIndex, lessonIndex)}
              size="sm"
            >
              <FaTrash />
            </Button>
          )}
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
          disabled={readOnly}
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
          disabled={readOnly}
        />
      </Form.Group>
      {/* Render extra content if provided */}
      {renderLessonExtra && renderLessonExtra(unitIndex, lessonIndex, lesson)}
    </Accordion.Body>
  </Accordion.Item>
);

export default LessonItem;