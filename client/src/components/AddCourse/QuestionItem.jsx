import { Accordion, Form, Button } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";

const QuestionItem = ({
  q,
  qIdx,
  setIndex,
  unitIndex,
  handleRemoveQuestion,
  handleQuestionChange,
  readOnly, // <-- add this prop
}) => (
  <Accordion.Item eventKey={`q-${unitIndex}-${setIndex}-${qIdx}`}>
    <Accordion.Header>
      {q.questionText
        ? q.questionText.slice(0, 30) +
          (q.questionText.length > 30 ? "..." : "")
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
          disabled={readOnly}
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
            disabled={readOnly}
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
          disabled={readOnly}
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
          disabled={readOnly}
        />
      </Form.Group>
      <div className="text-end">
        {!readOnly && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => handleRemoveQuestion(unitIndex, qIdx, setIndex)}
          >
            <FaTrash /> Remove Question
          </Button>
        )}
      </div>
    </Accordion.Body>
  </Accordion.Item>
);

export default QuestionItem;