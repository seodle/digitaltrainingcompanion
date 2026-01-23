import { Box} from "@mui/material";
import { useLocation } from "react-router-dom";
import Sidebar from "../../scenes/global/Sidebar";
import Topbar from "../../scenes/global/Topbar";
import AddSurvey from "../../components/AddSurvey";
import { AssessmentType } from "../../utils/enums";

// the map between the assessment type and the predifined questions
const questionIdMap = {
    [AssessmentType.TRAINEE_CHARACTERISTICS]: ["0", "1", "2", "3", "4"],
    [AssessmentType.TRAINING_CHARACTERISTICS]: ["5", "6", "7", "8", "9", "10"],
    [AssessmentType.IMMEDIATE_REACTIONS]: ["11", "12", "13","14","15"],
    [AssessmentType.ORGANIZATIONAL_CONDITIONS]: ["16", "17", "18", "19", "20", "21"],
    [AssessmentType.SUSTAINABILITY_CONDITIONS]: ["22", "23", "24", "25", "26", "27"],
    [AssessmentType.STUDENT_CHARACTERISTICS]: ["28", "29", "30", "31"],
    [AssessmentType.LEARNING]: [],
    [AssessmentType.BEHAVIORAL_CHANGES]: ["32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"],
    [AssessmentType.STUDENT_LEARNING_OUTCOMES]: [],
};

// all assessment types
const assessmentEntries = Object.entries(AssessmentType);


const CreateSurvey = () => {

    const location = useLocation();
    const { assessmentType, assessmentName, assessmentId } = location.state || {};

    console.log("assessmentType", assessmentType)
    console.log("assessmentName", assessmentName)
    console.log("assessmentId", assessmentId)

    return (
        <Box display="flex" backgroundColor="white" style={{ height: '100vh' }}>
            <Sidebar />
            <Box flex={1}>

                <Box ml="10px">
                    <Topbar />
                </Box>


                {assessmentType === AssessmentType.TRAINEE_CHARACTERISTICS && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.TRAINEE_CHARACTERISTICS]} />}  
                {assessmentType === AssessmentType.TRAINING_CHARACTERISTICS && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.TRAINING_CHARACTERISTICS]} />}  
                {assessmentType === AssessmentType.IMMEDIATE_REACTIONS && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.IMMEDIATE_REACTIONS]} />}
                {assessmentType === AssessmentType.SUSTAINABILITY_CONDITIONS && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.SUSTAINABILITY_CONDITIONS]} />}
                {assessmentType === AssessmentType.STUDENT_CHARACTERISTICS && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.STUDENT_CHARACTERISTICS]} />}
                {assessmentType === AssessmentType.ORGANIZATIONAL_CONDITIONS && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.ORGANIZATIONAL_CONDITIONS]} />}
                {assessmentType === AssessmentType.LEARNING && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.LEARNING]} />}
                {assessmentType === AssessmentType.BEHAVIORAL_CHANGES && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.BEHAVIORAL_CHANGES]} />} 
                {assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES && <AddSurvey currentAssessmentServerId={assessmentId} predifinedQuestionIds={questionIdMap[AssessmentType.STUDENT_LEARNING_OUTCOMES]} />}
                 
            </Box>
        </Box>
    );
};

export default CreateSurvey;