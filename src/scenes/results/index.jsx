import React, { useEffect, useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import SurveyAnswer from '../../components/SurveyAnswer';
import { useLocation } from 'react-router-dom';
import logo_dtc from "../../assets/medias/logo.svg";
import { BACKEND_URL } from "../../config"; 

const Results = () => {
  // Get the surveyId of the survey the user has just answered from the URL
  // Allow retrieving the survey in the database to update it with the user's email
  const location = useLocation();
  const surveyId = location.state?.surveyId;

  // Initialize state to hold surveys and response counts
  const [survey, setSurvey] = useState([]);
  const [responseCounts, setResponseCounts] = useState([]);
  const [loading, setLoading] = useState(true); // Initialize loading state to true
  const [email, setEmail] = useState(''); // State to manage the email input
  const [emailSent, setEmailSent] = useState(false); // State to manage email sent status
  const [respondentAnswers, setRespondentAnswers] = useState([]); // State for respondent answers

  // Function to count the responses to each question in the survey
  function countResponses(survey) {
  const responseCounts = [];

  for (const document of survey) {
    for (const question of document.questions) {
      const questionId = question.questionId;
      let responses = question.response;

      if (!Array.isArray(responses)) {
        responses = [responses];
      }

      if (!responseCounts[questionId]) {
        responseCounts[questionId] = {};
      }

      for (const response of responses) {
        if (response && response.trim() !== '') {
          if (!responseCounts[questionId][response]) {
            responseCounts[questionId][response] = 1;
          } else {
            responseCounts[questionId][response]++;
          }
        }
      }
    }
  }

  const data = [];
  for (const questionId in responseCounts) {
    const questionData = [];
    const totalResponses = Object.values(responseCounts[questionId]).reduce((a, b) => a + b, 0);
    for (const response in responseCounts[questionId]) {
      const percentage = (responseCounts[questionId][response] / totalResponses) * 100;
      questionData.push({ response: response, value: percentage.toFixed(2) });
    }
    data.push(questionData);
  }

  return data;
}

  // Function to validate email form
  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  // Function to send email to server
  const sendEmail = async () => {
    if (validateEmail(email)) {
      try {

        const authToken = localStorage.getItem("token");
        // Send a PUT request using fetch
        const response = await fetch(`${BACKEND_URL}/survey/updateEmail`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ email, surveyId }),
        });
        const data = await response.json();
        console.log(data); // Log the server response for debugging
        setEmailSent(true);
      } catch (error) {
        console.error('Error sending email:', error);
        // Handle the error and provide appropriate feedback to the user
      }
    } else {
      alert('Please enter a valid email');
    }
  };

  // Hook to fetch survey results when component loads
  useEffect(() => {
    const fetchData = async () => {
      try {
        const authToken = localStorage.getItem("token");
        // Send a GET request using fetch
        const response = await fetch(`${BACKEND_URL}/results`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
        });
        const data = await response.json();
        setSurvey(data);
        
        // Send a GET request using fetch
        const respondentAnswers = await fetch(`${BACKEND_URL}/results/respondent/${surveyId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
        });

        const answersData = await respondentAnswers.json();
        setRespondentAnswers(answersData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching survey results:', error);
        // Handle the error and provide appropriate feedback to the user
      }
    };

    fetchData();
  }, [surveyId]);


  // Update responseCounts whenever surveys change
  useEffect(() => {
    setResponseCounts((prevResponseCounts) => countResponses(survey));
  }, [survey]);

  // Return the component to be rendered
  return (
    <>
      <Box
        m="40px"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Box>
          <img
            alt=""
            width="100%"
            height="100%"
            src={logo_dtc}
            style={{ cursor: 'pointer', borderRadius: '0%' }}
          />
        </Box>
      </Box>

      <Box display="flex" alignItems="center" justifyContent="center">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexDirection="column"
          sx={{
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backgroundColor: '#fff',
            width: {
              xs: '90vw', 
              md: '50vw',
            },
          }}
        >
          <Typography style={{ marginTop: '20px', marginBottom: '10px' }} variant="h2" fontWeight="bold">
            Résultats
          </Typography>

          <Typography mb="50px" variant="h6" fontWeight="bold" style={{ textAlign: 'center' }}>
              Nombre de réponses : {surveyId}<br></br> Voici vos réponses et celles de l'ensemble des répondant.e.s.
          </Typography>



          {loading ? (
            <Typography variant="h6">Loading...</Typography>
          ) : (
            <>
              <SurveyAnswer
                question={survey[0]?.questions[0]?.question || ''}
                data={responseCounts[0] || []}
                respondentAnswers={respondentAnswers?.questions[0].response}
              />
              <SurveyAnswer
                question={survey[0]?.questions[2]?.question || ''}
                data={responseCounts[2] || []}
                respondentAnswers={respondentAnswers?.questions[2].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[5]?.question || ''}
                data={responseCounts[5] || []}
                respondentAnswers={respondentAnswers?.questions[5].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[8]?.question || ''}
                data={responseCounts[8] || []}
                respondentAnswers={respondentAnswers?.questions[8].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[10]?.question || ''}
                data={responseCounts[10] || []}
                respondentAnswers={respondentAnswers?.questions[10].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[13]?.question || ''}
                data={responseCounts[13] || []}
                respondentAnswers={respondentAnswers?.questions[13].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[14]?.question || ''}
                data={responseCounts[14] || []}
                respondentAnswers={respondentAnswers?.questions[14].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[17]?.question || ''}
                data={responseCounts[17] || []}
                respondentAnswers={respondentAnswers?.questions[17].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[18]?.question || ''}
                data={responseCounts[18] || []}
                respondentAnswers={respondentAnswers?.questions[18].response}

              />
              <SurveyAnswer
                question={survey[0]?.questions[19]?.question || ''}
                data={responseCounts[19] || []}
                respondentAnswers={respondentAnswers?.questions[19].response}

              />

              {emailSent ? (
                <Typography m="20px" variant="h4" fontWeight="bold">
                  Merci ! Nous vous tiendrons informé.e.s de l'avancée de The Digital Training Companion !
                </Typography>
              ) : (
                <>
                  <Typography m="20px" variant="h2" fontWeight="bold">
                    Merci pour participation!
                  </Typography>
                  <Typography m="20px" variant="h4" fontWeight="bold">
                    Souhaitez-vous rester informé.e de l'avancée de The Digital Training Companion ?
                  </Typography>
                  <Box m="15px" width="50%">
                    <TextField
                      label="Enter your email"
                      type="email"
                      variant="outlined"
                      fullWidth
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      sx={{ p: '0px' }}
                    />
                  </Box>

                  <Box m="15px">
                    <Button
                      onClick={sendEmail}
                      type="submit"
                      variant="contained"
                      sx={{
                        backgroundColor: '#F7941E',
                        borderRadius: '50px',
                        color: 'black',
                        '&:hover': {
                          backgroundColor: '#D17A1D',
                        },
                      }}
                    >
                      <Typography variant="h5">Valider</Typography>
                    </Button>
                  </Box>
                </>
              )}
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default Results;
