import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { Box, Button, Typography } from '@mui/material';
import axios from 'axios';
import SurveyQuestion from '../../components/SurveyQuestion';
import logo_dtc from "../../assets/medias/logo.svg";
import { BACKEND_URL } from "../../config"; 

const getSurveyCount = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/questionnaire/count`); 
    return response.data.count;
  } catch (error) {
    console.error('Error getting count of surveys:', error);
  }
};

const Survey = () => {
  const initialValues = {
    q1: '',
    q11: '',
    q12: '',
    q121: '',
    q122: '',
    q13: '',
    q13_other: '',
    q14: '',
    q141: '',
    q141_other: '',
    q142: '',
    q1421: '',
    q1422: '',
    q15: '',
    q151: '',
    q152: '',
    q153: '',
    q16: '',
    q2: '',
    q2_other: '',
    q3: '',
    name: '',
  };

  let navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    setSubmitting(true);

    try {
      // Get the current count of surveys from the server
      const surveyCount = await getSurveyCount();

      // Calculate the new survey ID
      const surveyId = surveyCount + 1;

      // Send a POST request to the server with the new survey data
      const response = await axios.post(`${BACKEND_URL}/questionnaire`, {
        surveyId: surveyId,
        q1: Array.isArray(values.q1) ? values.q1 : [values.q1],
        q11: values.q11,
        q12: Array.isArray(values.q12) ? values.q12 : [values.q12],
        q121: values.q121,
        q122: values.q122,
        q13: Array.isArray(values.q13) ? values.q13 : [values.q13],
        q13_other: values.q13_other,
        q14: Array.isArray(values.q14) ? values.q14 : [values.q14],
        q141: Array.isArray(values.q141) ? values.q141 : [values.q141],
        q141_other: values.q141_other,
        q142: Array.isArray(values.q142) ? values.q142 : [values.q142],
        q1421: values.q1421,
        q1422: values.q1422,
        q15: Array.isArray(values.q15) ? values.q15 : [values.q15],
        q151: Array.isArray(values.q151) ? values.q151 : [values.q151],
        q152: values.q152,
        q153: values.q153,
        q16: Array.isArray(values.q16) ? values.q16 : [values.q16],
        q17: Array.isArray(values.q17) ? values.q17 : [values.q17],
        q2: Array.isArray(values.q2) ? values.q2 : [values.q2],
        q2_other: values.q2_other,
        q3: values.q3,
      });

      console.log(response.data); // Log the response from the server

      navigate('/results', { state: { surveyId: surveyId } });       // Redirect to the /results page
    } catch (error) {
      console.error('Error updating database:', error);
    }

    setSubmitting(false);
  };

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
          <Formik initialValues={initialValues} onSubmit={handleSubmit}>
            {({ values, setFieldValue }) => (
              <Form>
                <SurveyQuestion
                  question="Concevez-vous (ou des membres de votre organisation) des formations aux compétences numériques au sein de votre organisation ?"
                  fieldName="q1"
                  options={[
                    { value: 'Oui', label: 'Oui' },
                    { value: 'Non', label: 'Non' },
                    { value: 'Je ne sais pas', label: 'Je ne sais pas' },
                  ]}
                  type="radio-unordered"
                  setFieldValue={setFieldValue}
                  viewType="createSurvey"
                />

                {values.q1 === 'Oui' && (
                  <SurveyQuestion
                    question="Quelles compétences spécifiques sont ciblées par ces formations ?"
                    fieldName="q11"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q1 === 'Oui' && (
                  <SurveyQuestion
                    question="Utilisez-vous des référentiels de compétences numériques spécifiques pour la réalisation de vos formations ?"
                    fieldName="q12"
                    options={[
                      { value: 'Oui', label: 'Oui' },
                      { value: 'Non', label: 'Non' },
                      { value: 'Je ne sais pas', label: 'Je ne sais pas' },
                    ]}
                    type="radio-unordered"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q12 === 'Oui' && (
                  <SurveyQuestion
                    question="Lesquels ?"
                    fieldName="q121"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q12 === 'Non' && (
                  <SurveyQuestion
                    question="Pouvez-vous nous dire pourquoi ?"
                    fieldName="q122"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q1 === 'Oui' && (
                  <SurveyQuestion
                    question="À quelle fréquence sont réalisées ces formations ?"
                    fieldName="q13"
                    options={[
                      { value: '1 fois par jour', label: '1 fois par jour' },
                      { value: '1 fois par semaine', label: '1 fois par semaine' },
                      { value: '1 fois par mois', label: '1 fois par mois' },
                      { value: '1 fois par trimestre', label: '1 fois par trimestre' },
                      { value: '1 fois par semestre', label: '1 fois par semestre' },
                      { value: '1 fois par an', label: '1 fois par an' },
                      { value: 'Autre', label: 'Autre' },
                    ]}
                    type="radio-ordered"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q13 === 'Autre' && (
                  <SurveyQuestion
                    question="Veuillez préciser :"
                    fieldName="q13_other"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q1 === 'Oui' && (
                  <SurveyQuestion
                    question="Réalisez-vous une évaluation ou un suivi de ces formations ?"
                    fieldName="q14"
                    options={[
                      { value: 'Oui', label: 'Oui' },
                      { value: 'Non', label: 'Non' },
                      { value: 'Je ne sais pas', label: 'Je ne sais pas' },
                    ]}
                    type="radio-unordered"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q14 === 'Oui' && (
                  <SurveyQuestion
                    question="Quels types d'évaluation ou de suivi réalisez-vous ?"
                    fieldName="q141"
                    options={[
                      {
                        value: "J'évalue les réactions des participants",
                        label: "J'évalue les réactions des participants après la formation",
                      },
                      {
                        value: "J'évalue l'acquisition des connaissances",
                        label: "J'évalue l'acquisition des connaissances et des compétences acquises au cours de la formation",
                      },
                      {
                        value: "J'évalue les conditions de mise en oeuvre",
                        label: "J'évalue les conditions qui peuvent faciliter ou entraver la mise en oeuvre de ces nouvelles compétences sur le lieu de travail",
                      },
                      {
                        value: "J'évalue la mise en oeuvre",
                        label: "J'évalue la mise en oeuvre effective des compétences acquises en formation sur le lieu de travail",
                      },
                      {
                        value: "J'évalue l'impact",
                        label: "J'évalue l'impact sur la productivité ou sur les compétences des bénéficiaires finaux (élèves)",
                      },
                      {
                        value: "J'évalue le retour sur investissement",
                        label: "J'évalue le retour sur investissement de la formation",
                      },
                      { value: 'Autre', label: 'Autre' },
                    ]}
                    type="checkbox"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q141.includes('Autre') && (
                  <SurveyQuestion
                    question="Veuillez préciser :"
                    fieldName="q141_other"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q14 === 'Oui' && (
                  <SurveyQuestion
                    question="Utilisez-vous des outils numériques pour vous assister dans l'évaluation de vos formations?"
                    fieldName="q142"
                    options={[
                      { value: 'Oui', label: 'Oui' },
                      { value: 'Non', label: 'Non' },
                      { value: 'Je ne sais pas', label: 'Je ne sais pas' },
                    ]}
                    type="radio-unordered"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q142 === 'Oui' && (
                  <SurveyQuestion
                    question="Quels outils utilisez-vous ?"
                    fieldName="q1421"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q142 === 'Non' && (
                  <SurveyQuestion
                    question="Pouvez-vous nous expliquer pourquoi ?"
                    fieldName="q1422"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q1 === 'Oui' && (
                  <SurveyQuestion
                    question="Pensez-vous que l'évaluation et le suivi des formations aux compétences numériques soient utiles ?"
                    fieldName="q15"
                    options={[
                      { value: 'Oui', label: 'Oui' },
                      { value: 'Non', label: 'Non' },
                      { value: 'Je ne sais pas', label: 'Je ne sais pas' },
                    ]}
                    type="radio-unordered"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q15 === 'Oui' && (
                  <SurveyQuestion
                    question=" Trouveriez-vous utile d'avoir une application web pour vous assister dans l'évaluation et le suivi de vos formations en éducation numérique ?"
                    fieldName="q151"
                    options={[
                      { value: 'Oui', label: 'Oui' },
                      { value: 'Non', label: 'Non' },
                      { value: 'Je ne sais pas', label: 'Je ne sais pas' },
                    ]}
                    type="radio-unordered"
                    setFieldValue={setFieldValue}
                    viewType="createSurvey"
                  />
                )}

                {values.q15 === 'Oui' && (
                  <SurveyQuestion
                    question="Quelles fonctionnalités souhaiteriez-vous que cette application vous fournisse ?"
                    fieldName="q152"
                    type="text"
                    viewType="createSurvey"
                  />
                )}

                {values.q15 === 'Oui' && (
                    <SurveyQuestion 
                    question="Quel serait à votre avis le juste prix d'un abonnement mensuel pour une application web de ce genre ? (en CHF / EUR / $)" 
                    fieldName="q153" 
                    type="slider" 
                    min={5} 
                    max={50}
                    viewType="createSurvey"
                  />
                )}

                {values.q1 === 'Oui' && (
                  <SurveyQuestion
                    question="Pour quelle(s) tranche(s) d'âge réalisez-vous ces formations ?"
                    fieldName="q16"
                    options={[
                      { value: 'Moins de 18 ans', label: 'Moins de 18 ans' },
                      { value: '18-24 ans', label: '18-24 ans' },
                      { value: '25-34 ans', label: '25-34 ans' },
                      { value: '35-44 ans', label: '35-44 ans' },
                      { value: '45-54 ans', label: '45-54 ans' },
                      { value: '55 ans et plus', label: '55 ans et plus' },
                    ]}
                    type="checkbox"
                  />
                )}

                <SurveyQuestion
                  question="Dans quelle tranche d'âge vous situez-vous ?"
                  fieldName="q17"
                  options={[
                    { value: '18-24 ans', label: '18-24 ans' },
                    { value: '25-34 ans', label: '25-34 ans' },
                    { value: '35-44 ans', label: '35-44 ans' },
                    { value: '45-54 ans', label: '45-54 ans' },
                    { value: '55 ans ou plus', label: '55 ans ou plus' },
                  ]}
                  type="radio-unordered"
                />

                <SurveyQuestion
                  question="Vous êtes :"
                  fieldName="q2"
                  options={[
                    { value: 'Formateur', label: 'Formateur' },
                    { value: 'Responsable de la formation', label: 'Responsable de la formation' },
                    { value: 'Responsable de service', label: 'Responsable de service' },
                    { value: 'Dirigeant', label: 'Dirigeant' },
                    { value: 'Autre', label: 'Autre' },
                  ]}
                  type="radio-unordered"
                />

                {values.q2 === 'Autre' && (
                  <SurveyQuestion
                    question="Veuillez préciser :"
                    fieldName="q2_other"
                    type="text"
                  />
                )}

                <SurveyQuestion
                  question="Dans quelle organisation travaillez-vous?"
                  fieldName="q3"
                  type="text"
                />


                <Box mt={5} display="flex" justifyContent="center">
                  <Button
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
                    <Typography variant="h5">Envoyer</Typography>
                  </Button>
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </>
  );
};

export default Survey;
