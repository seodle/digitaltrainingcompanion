import { Formik, Form } from "formik";
import * as Yup from "yup";
import { Box, TextField, Button, Typography } from "@mui/material";
import React from "react";
import { v4 as uuidv4 } from 'uuid';
import { useMessageService } from '../services/MessageService';


const AddWorkshop = ({ workshops, setWorkshops, setQuestions }) => {

    console.log("workshops?", workshops)

    const initialValues = { workshop: "" };
    const { getMessage } = useMessageService();
    

    // Extract workshop names for validation
    const workshopNames = workshops.map(w => w.label);

    // Define the Yup validation schema inside the component
    const AddWorkshopSchema = Yup.object().shape({
        workshop: Yup.string()
            .min(2, "The short name must be at least 2 characters long")
            .max(40, "The short name must be at most 40 characters long")
            .required("The section title is required")
            .notOneOf(workshopNames, "This section title already exists"),
    });

    const handleSubmit = (values, { resetForm }) => {
    const newWorkshopTitle = values.workshop;

    // No longer generate default questions when adding a workshop

    const workshopPosition = workshops.length; 

    // Create new workshop object (backend will assign _id when saved)
    const newWorkshop = {
      _id: uuidv4(),
      label: newWorkshopTitle,
      workshopPosition: workshopPosition
    };

    // Update the set of workshops with the new workshop object
    setWorkshops(prevWorkshops => {
        // Check if workshop with this name already exists
        const exists = prevWorkshops.some(w => w.label === newWorkshopTitle);
        if (!exists) {
            return [...prevWorkshops, newWorkshop];
        }
        return prevWorkshops;
    });

    // Link existing orphan questions to the first workshop created
    if (workshops.length === 0 && typeof setQuestions === 'function') {
      setQuestions(prevQuestions => prevQuestions.map(q => {
        const hasWorkshop = q && q.workshopId !== undefined && q.workshopId !== null && q.workshopId !== "";
        if (hasWorkshop) return q;
        return { ...q, workshopId: newWorkshop._id };
      }));
    }

    resetForm();
  };



  const styles = {
    formGroup: {
      display: "flex",
      flexDirection: "column",
      marginBottom: "1rem",
    },
    invalidFeedback: {
      color: "red",
      marginTop: "0.25rem",
    },
  };

  return (
    <Box ml="20px" mr="20px">
      <Box
        sx={{
          borderRadius:"4px",
        }}
      >
        <Formik
          initialValues={initialValues}
          validationSchema={AddWorkshopSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur }) => (
            <Form>
              <div style={styles.formGroup}>
                <TextField
                  id="workshop"
                  label={getMessage("label_add_section_title")}
                  value={values.workshop}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.workshop && errors.workshop ? true : false}
                  sx={{mb:"15px"}}
                  helperText={touched.workshop && errors.workshop ? errors.workshop : ""}
                />
              </div>

              <Box sx={{mt:"15px"}}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: "#F7941E",
                    borderRadius: "50px",
                    color: "black",
                    "&:hover": {
                        backgroundColor: "#D17A1D",
                    },
                  }}
                >
                  <Typography variant="h5">{getMessage("label_add")}</Typography>
                </Button>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  )
};

export default AddWorkshop;
