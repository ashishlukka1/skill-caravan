import { Accordion, Row, Col, Form, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import LessonAccordion from "./LessonAccordion";
import AssignmentAccordion from "./AssessmentAccordion";

const UnitItem = ({
  unit,
  unitIndex,
  handleRemoveUnit,
  handleUnitChange,
  renderLessonExtra,
  readOnly, // <-- add this prop
  ...lessonAndAssignmentHandlers
}) => (
  <Accordion.Item eventKey={unitIndex.toString()}>
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
                handleUnitChange(unitIndex, "title", e.target.value)
              }
              required
              placeholder="Unit Title"
              disabled={readOnly}
            />
          </Form.Group>
        </Col>
        <Col md={2} className="text-end">
          {!readOnly && (
            <Button
              variant="outline-danger"
              onClick={() => handleRemoveUnit(unitIndex)}
              size="sm"
            >
              <FaTrash />
            </Button>
          )}
        </Col>
      </Row>
      <LessonAccordion
        unit={unit}
        unitIndex={unitIndex}
        renderLessonExtra={renderLessonExtra}
        readOnly={readOnly} // <-- pass down
        {...lessonAndAssignmentHandlers}
      />
      <AssignmentAccordion
        unit={unit}
        unitIndex={unitIndex}
        readOnly={readOnly} // <-- pass down
        {...lessonAndAssignmentHandlers}
      />
    </Accordion.Body>
  </Accordion.Item>
);

export default UnitItem;