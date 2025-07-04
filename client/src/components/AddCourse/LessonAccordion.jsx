import { Accordion, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import LessonItem from "./LessonItem";

const LessonAccordion = ({
  unit,
  unitIndex,
  handleAddLesson,
  handleRemoveLesson,
  handleLessonChange,
  renderLessonExtra,
  readOnly, // <-- add this prop
}) => (
  <>
    <h5 className="mt-3 mb-2">Lessons</h5>
    <Accordion alwaysOpen>
      {unit.lessons.map((lesson, lessonIndex) => (
        <LessonItem
          key={lessonIndex}
          lesson={lesson}
          lessonIndex={lessonIndex}
          unitIndex={unitIndex}
          handleRemoveLesson={handleRemoveLesson}
          handleLessonChange={handleLessonChange}
          renderLessonExtra={renderLessonExtra}
          readOnly={readOnly} // <-- pass down
        />
      ))}
    </Accordion>
    {!readOnly && (
      <div className="my-2 text-end">
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => handleAddLesson(unitIndex)}
          type="button"
        >
          Add Lesson
        </Button>
      </div>
    )}
  </>
);

export default LessonAccordion;