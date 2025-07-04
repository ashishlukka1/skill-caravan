import { Accordion, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import QuestionItem from "./QuestionItem";

const QuestionAccordion = ({
  set,
  setIndex,
  unitIndex,
  handleAddQuestion,
  handleRemoveQuestion,
  handleQuestionChange,
  readOnly, // <-- add this prop
}) => (
  <>
    <h6 className="mt-3 mb-2">Questions</h6>
    <Accordion alwaysOpen>
      {set.questions.map((q, qIdx) => (
        <QuestionItem
          key={qIdx}
          q={q}
          qIdx={qIdx}
          setIndex={setIndex}
          unitIndex={unitIndex}
          handleRemoveQuestion={handleRemoveQuestion}
          handleQuestionChange={handleQuestionChange}
          readOnly={readOnly} // <-- pass down
        />
      ))}
    </Accordion>
    {!readOnly && (
      <div className="my-2 text-end">
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => handleAddQuestion(unitIndex, setIndex)}
        >
          <FaPlus className="me-1" /> Add Question
        </Button>
      </div>
    )}
  </>
);

export default QuestionAccordion;