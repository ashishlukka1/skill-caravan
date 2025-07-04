import { Accordion, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import AssignmentSetItem from "./AssessmentSetItem";

const AssignmentAccordion = ({
  unit,
  unitIndex,
  handleAddAssignmentSet,
  handleRemoveAssignmentSet,
  handleAssignmentSetChange,
  readOnly, // <-- add this prop
  ...questionHandlers
}) => (
  <div className="mt-4">
    <h5 className="mb-2">Assessment Sets</h5>
    <Accordion alwaysOpen>
      {unit.assignment.assignmentSets.map((set, setIndex) => (
        <AssignmentSetItem
          key={setIndex}
          set={set}
          setIndex={setIndex}
          unitIndex={unitIndex}
          handleRemoveAssignmentSet={handleRemoveAssignmentSet}
          handleAssignmentSetChange={handleAssignmentSetChange}
          readOnly={readOnly} // <-- pass down
          {...questionHandlers}
        />
      ))}
    </Accordion>
    {!readOnly && (
      <div className="my-2 text-end">
        <Button
          variant="outline-success"
          size="sm"
          onClick={() => handleAddAssignmentSet(unitIndex)}
        >
          <FaPlus className="me-1" /> Add Assessment Set
        </Button>
      </div>
    )}
  </div>
);

export default AssignmentAccordion;