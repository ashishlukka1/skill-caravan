import { Accordion, Button } from "react-bootstrap";
import { FaPlus } from "react-icons/fa";
import UnitItem from "./UnitItem";

const UnitAccordion = ({
  units,
  handleAddUnit,
  handleRemoveUnit,
  handleUnitChange,
  renderLessonExtra,
  readOnly, // <-- add this prop
  ...lessonAndAssignmentHandlers
}) => (
  <>
    <h4 className="mb-3">Units</h4>
    <Accordion defaultActiveKey={units.length ? "0" : undefined}>
      {units.map((unit, unitIndex) => (
        <UnitItem
          key={unitIndex}
          unit={unit}
          unitIndex={unitIndex}
          handleRemoveUnit={handleRemoveUnit}
          handleUnitChange={handleUnitChange}
          renderLessonExtra={renderLessonExtra}
          readOnly={readOnly} // <-- pass down
          {...lessonAndAssignmentHandlers}
        />
      ))}
    </Accordion>
    {!readOnly && (
      <div className="my-3 text-end">
        <Button variant="outline-success" onClick={handleAddUnit}>
          <FaPlus className="me-1" /> Add Unit
        </Button>
      </div>
    )}
  </>
);

export default UnitAccordion;