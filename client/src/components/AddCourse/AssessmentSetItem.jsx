import { Accordion, Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import QuestionAccordion from "./QuestionAccordion";

const AssignmentSetItem = ({
  set,
  setIndex,
  unitIndex,
  handleRemoveAssignmentSet,
  handleAssignmentSetChange,
  ...questionHandlers
}) => (
  <Accordion.Item eventKey={`set-${unitIndex}-${setIndex}`}>
    <Accordion.Header>{set.title || `Set ${setIndex + 1}`}</Accordion.Header>
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
              placeholder="Assessment Set Title"
            />
          </Form.Group>
        </Col>
        <Col md={2} className="text-end">
          <Button
            variant="outline-danger"
            onClick={() => handleRemoveAssignmentSet(unitIndex, setIndex)}
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
          placeholder="Assessment Set Description"
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
      <QuestionAccordion
        set={set}
        setIndex={setIndex}
        unitIndex={unitIndex}
        {...questionHandlers}
      />
    </Accordion.Body>
  </Accordion.Item>
);

export default AssignmentSetItem;