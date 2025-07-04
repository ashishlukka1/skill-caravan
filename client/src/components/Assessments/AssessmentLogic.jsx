import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../utils/axios";
import { AuthContext } from "../../context/AuthContext";

export function useAssignmentLogic() {
  const { id, unitIndex } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [assignmentSet, setAssignmentSet] = useState(null);
  const [shuffledQuestions, setShuffledQuestions] = useState([]);
  const [questionOrder, setQuestionOrder] = useState([]);

  // State for alerts
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  //Shuffle function to randomize question order
  function shuffleArray(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // Initialize assignment set and shuffle questions
  const initializeAssignment = (set, prevSubmission = null) => {
    if (!set) return;
    const indices = Array.from({ length: set.questions.length }, (_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    setQuestionOrder(shuffledIndices);
    setShuffledQuestions(shuffledIndices.map((idx) => set.questions[idx]));
    setAnswers(
      prevSubmission && prevSubmission.length === set.questions.length
        ? shuffledIndices.map((idx) => prevSubmission[idx])
        : Array(set.questions.length).fill(null)
    );
    setCurrentQ(0);
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [courseRes, progressRes] = await Promise.all([
          axios.get(`/api/courses/${id}`),
          axios.get(`/api/progress/${id}`),
        ]);

        const unit = courseRes.data.units[parseInt(unitIndex)];
        if (
          !unit ||
          !unit.assignment ||
          !Array.isArray(unit.assignment.assignmentSets) ||
          unit.assignment.assignmentSets.length === 0
        ) {
          throw new Error("No assignment found for this unit");
        }

        setCourse(courseRes.data);
        setProgress(progressRes.data);

        const unitProg = progressRes.data.unitsProgress[parseInt(unitIndex)];
        let assignedSetNumber = unitProg?.assignment?.assignedSetNumber;

        if (!assignedSetNumber && unit.assignment.assignmentSets.length === 1) {
          assignedSetNumber = unit.assignment.assignmentSets[0].setNumber;
        }
        if (!assignedSetNumber && unit.assignment.assignmentSets.length > 1) {
          assignedSetNumber = unit.assignment.assignmentSets[0].setNumber;
        }

        const currentSet =
          unit.assignment.assignmentSets.find(
            (set) => set.setNumber === assignedSetNumber
          ) || unit.assignment.assignmentSets[0];

        setAssignmentSet(currentSet);

        if (currentSet) {
          initializeAssignment(currentSet, unitProg?.assignment?.submission);
        }

        setSubmitted(unitProg?.assignment?.status === "submitted");
        setScore(unitProg?.assignment?.score || 0);
      } catch (err) {
        setError(err.message || "Failed to load assignment");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, unitIndex]);

  const handleSelect = (questionIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = optionIndex;
      return newAnswers;
    });
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      if (!assignmentSet) {
        throw new Error("No assignment set found");
      }
      const reorderedAnswers = [];
      questionOrder.forEach((originalIdx, shuffledIdx) => {
        reorderedAnswers[originalIdx] = answers[shuffledIdx];
      });

      const totalPossibleMarks = assignmentSet.questions.reduce(
        (acc, q) => acc + q.marks,
        0
      );

      const response = await axios.post(
        `/api/courses/${id}/assignment/${unitIndex}/submit`,
        {
          submission: reorderedAnswers,
        }
      );

      setScore(response.data.score);
      setSubmitted(true);

      setAlertMessage("Assignment submitted!");
      setShowSuccessAlert(true);

      if (response.data.score === totalPossibleMarks) {
        const progressRes = await axios.get(`/api/progress/${id}`);
        setProgress(progressRes.data);
      }
    } catch (err) {
      setAlertMessage(
        err.response?.data?.message || "Failed to submit assignment"
      );
      setShowErrorAlert(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNewAttempt = async () => {
    try {
      const currentUnit = course.units[parseInt(unitIndex)];
      const availableSets = currentUnit.assignment.assignmentSets;
      const currentSetNumber = assignmentSet.setNumber;

      if (availableSets.length === 1) {
        initializeAssignment(assignmentSet);
        setSubmitted(false);
        setShowReview(false);
        setScore(0);
        return;
      }

      const remainingSets = availableSets.filter(
        (set) => set.setNumber !== currentSetNumber
      );
      if (remainingSets.length === 0) {
        setAlertMessage(
          "No more assignment sets available. Please return to the course."
        );
        setShowErrorAlert(true);
        navigate(`/courses/${id}`);
        return;
      }

      const assignSetRes = await axios.post(
        `/api/progress/${id}/unit/${unitIndex}/assign-set`,
        {
          excludeSet: currentSetNumber,
        }
      );
      const newUnitProg = assignSetRes.data.unitsProgress[parseInt(unitIndex)];
      const newSet = currentUnit.assignment.assignmentSets.find(
        (set) => set.setNumber === newUnitProg.assignment.assignedSetNumber
      );

      if (!newSet) {
        setAlertMessage("No more sets available");
        setShowErrorAlert(true);
        return;
      }

      setAssignmentSet(newSet);
      initializeAssignment(newSet);
      setSubmitted(false);
      setShowReview(false);
      setScore(0);
      setProgress(assignSetRes.data);
    } catch (err) {
      setAlertMessage("Could not assign new set. Returning to course.");
      setShowErrorAlert(true);
      navigate(`/courses/${id}`);
    }
  };

  return {
    id,
    unitIndex,
    course,
    progress,
    loading,
    submitting,
    error,
    currentQ,
    setCurrentQ,
    answers,
    setAnswers,
    submitted,
    setSubmitted,
    score,
    setScore,
    showReview,
    setShowReview,
    assignmentSet,
    setAssignmentSet,
    shuffledQuestions,
    setShuffledQuestions,
    questionOrder,
    setQuestionOrder,
    showSuccessAlert,
    setShowSuccessAlert,
    showErrorAlert,
    setShowErrorAlert,
    alertMessage,
    setAlertMessage,
    handleSelect,
    handleSubmit,
    handleNewAttempt,
    user,
    navigate,
  };
}
