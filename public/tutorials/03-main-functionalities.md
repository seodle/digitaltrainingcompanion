# Main functionalities

In the menu to the left, you'll find five feature sections:

## The DESIGN section

The DESIGN section includes **Monitorings**, the management page for your monitorings and assessments.

A **monitoring** is a collection of assessments. It can include one or more assessments from the various levels of the previously described model (see [A bit of theory](./02-theory.md)). Thus, a monitoring encompasses all assessments that can be conducted for a given training program.

![Monitorings interface](/tutorials/images/monitorings_en.png)

### Creating a Monitoring

1. Click on the **NEW MONITORING** button.
2. Enter a name and description for your monitoring.
3. Click **CREATE**.

> **Note:** You now have a monitoring set up, but it doesn't yet contain any assessments.

### Managing Your Monitoring

To edit a monitoring's name or description, simply click on the text you wish to change. You can only modify monitorings that you have created yourself.

For additional options, go to the **Actions** menu, where you can:

- **Delete** the entire monitoring
- **Delete all answers** from participants for this monitoring

> ⚠️ **Warning:** Deleting a monitoring or all answers is irreversible. Please use these options carefully.

### Sharing a Monitoring

1. Click on **SHARE MONITORING**
2. Give the **6-digit code** to other trainers or teachers
3. The recipient can use this code to access the monitoring

### Importing a Monitoring

1. Click on **IMPORT MONITORING**
2. Enter the **6-digit code** you received from the trainer

> 💡 **Sharing mode differs based on the role assigned:**
>
> - **Trainer mode:** The full monitoring with all assessments is shared
> - **Teacher mode:** Only the "Students characteristics" and "Student learning outcomes" assessment types are shared

### Understanding Assessments

An **assessment** specifically addresses questions related to one of the various levels of the previously described model. Each assessment can be presented as a survey page, allowing for easier categorization of responses and clearer display of results.

![Assessments interface](/tutorials/images/assessments_en.png)

### Creating an Assessment

1. Click on the **NEW ASSESSMENT** button.
2. Enter a session number for your monitoring. This allows you to separate different sets of assessments by training session (e.g., Day 1, Day 2). The session number affects the visualization of results and can be modified later.
3. Enter a name and select a type for your assessment. The type determines the kind of information you'll gather from teachers and impacts how results are displayed on the dashboard.

#### Assessment types include:

- **Trainee characteristics:** Gather information about teachers that may impact your training session (e.g., motivation levels). Usually collected before or at the beginning of training.
- **Training characteristics:** Collect feedback on the form of the training session at its conclusion.
- **Immediate reactions** (Guskey model, level 1): Assess participants' personal reactions to the training content.
- **Learning** (Guskey model, level 2): Evaluate what teachers have learned from your sessions.
- **Organizational conditions** (Guskey model, level 3): Gather information about field conditions.
- **Behavioral changes** (Guskey model, level 4): Assess if teachers have applied their learning.
- **Sustainability conditions:** Collect data on factors influencing the long-term sustainability of practices.
- **Student characteristics:** Gather information about students who will benefit from learning activities.
- **Student learning outcomes** (Guskey model, level 5): Assess student learning after implementation.

4. Click **CREATE**. Your assessment appears in the assessments table.

### Managing Your Assessments

- **Editing session number:** Click on the number you wish to change. Note: You can only modify assessments you have created.
- **Editing assessment name:** Click on the text you wish to change. Again, this is limited to assessments you've created.
- **Changing assessment status:** Click on the button indicating **DRAFT**, **OPEN**, or **CLOSED**.
- **Additional options:** Access the **Actions** menu for the following:
  - **Delete** the entire assessment
  - **Delete all answers** from participants for this assessment
- **Sharing an assessment:** Click the checkbox in the Share column. Sharing functionalities will then appear in the sharing space on the right.

> ⚠️ **Warning:** Deleting an assessment or all answers is irreversible. Please use these options carefully.

### Creating the Content of your Assessment

To create the content of your assessment, ensure it's in DRAFT status, then go to Actions and select Edit.

You can create different kinds of questions in your assessment. For Trainee characteristics, Training characteristics, Immediate reactions, Organizational conditions, Behavioral changes, Sustainability conditions and Student characteristics, the following types of questions are available:

- **Open ended:** This type allows you to create a simple open-ended question.
- **Single choice (ordered):** This type enables you to create a question with predefined answer options in a specific order.
- **Single choice (unordered):** Similar to radio-ordered, but the order of options is not significant.
- **Multiple choice:** This type allows respondents to select multiple answers from a list of predefined options.
- **Text only:** This type is not a question in itself, but it allows you to create formattable text, links, and images.

> ⚠️ **Important:** For the Single choice (ordered) type, always arrange the answer options from negative to positive, from top to bottom.

For the types Learning and Student Learning Outcomes, the following types of questions are available:

- **Open ended**
- **MCQ (Multiple Choice Question):** Single correct answer questions.
- **Text only**

> 💡 **Reminder:** Example questions are provided when you start editing an assessment.

> ⚠️ **Important:** Remember to click the VALIDATE button at the bottom of the page after completing your questionnaire.

You can also create your questionnaire directly using AI. To do this, simply copy and paste the desired content from your training into the designated area.

![AI assessment creation](/tutorials/images/creating_content_assessment_ai_en.png)

### Sharing your assessments

The **sharing space** allows you to incorporate assessments into your survey. Each assessment becomes a separate page, and you can easily add them by selecting the checkboxes in the Share column. As soon as you check a box, that assessment automatically becomes part of your survey.

![QR code section](/tutorials/images/qr_code_section_en.png)

Below the QR code, you'll find several sharing options:

• Generate a URL link to your survey
• Download the QR code in a larger format
• Download a paper-and-pencil version (PDF) for offline use
• Enable participant ID tracking - participants enter a unique code before starting the survey, allowing you to track their responses across different assessments
• Access the paper-and-pencil entry code - use this code to manually input data collected from printed surveys

## The MONITOR section

The MONITOR section includes the subsection "Results" that allows you to visualize and analyze data collected from your assessments.

![Monitor interface](/tutorials/images/monitor-section_en.png)

### Data Selection

At the top of the page, you'll find two dropdown menus:

- **Choose a monitoring:** Select which monitoring you want to analyze
- **Choose a session:** Pick the specific training session to view

### Results Dashboard

The dashboard is organized into different tabs corresponding to the assessment types:

- TRAINEE CHARACTERISTICS
- TRAINING CHARACTERISTICS
- IMMEDIATE REACTIONS
- LEARNING
- ORGANIZATIONAL CONDITIONS
- BEHAVIORAL CHANGES
- SUSTAINABILITY CONDITIONS
- STUDENT CHARACTERISTICS
- STUDENT LEARNING OUTCOMES

### Data Visualization

Results are presented through various visualization types depending on the question format:

- **Single choice (unordered) and Multiple choices:** Light blue bars
- **Single choice (ordered):** Color-coded bars from red (negative) to green (positive)
- **Open-ended questions:** Text responses are displayed in a scrollable format
- **Learning questions:** Incorrect answers are displayed in red, correct answer in green

### Additional Features

- **Filtering:** Use the "Filter by teacher" dropdown to focus on specific subsets of your data
- **Interactive elements:**
  - Use tabs to quickly switch between different assessment types
  - Hover over chart elements to see detailed values

### Export Features

Two export options are available in the top right corner:

- **DOWNLOAD REPORT AS PDF:** Generate a comprehensive PDF report of your results
- **EXPORT DATA AS CSV:** Download raw data for further analysis in other tools

### Best Practices for Monitoring

- Regularly check results during training sessions to make quick adjustments
- Compare results across different sessions to track progress
- Use the export features to create reports for stakeholders
- Pay attention to both quantitative data and qualitative feedback in open-ended responses

> 💡 **Reminder:** Remember to check your results regularly throughout your training program. This will help you identify areas that need attention and make timely adjustments to your training approach.

## The REGULATE section

The REGULATE section includes the subsection "Logbooks" that helps you track observations and plan improvements throughout your training program. This section is essential for maintaining detailed records and making data-driven adjustments to your training approach.

![Regulate interface](/tutorials/images/regulate-section_en.png)

### Creating Log Entries

To add a new log entry, you'll need to provide:

- **Description:** A clear, concise description of your observation or needed change
- **Session:** The training session number the entry relates to
- **Assessment Type:** Select from available assessment types (e.g., Trainee characteristics, Learning, Organizational conditions)
- **Type of Log:** Choose between 'Observation' or 'Change to make'

### Types of Logs

#### Observations

Record important findings from your monitoring results, such as:

- Patterns in participant responses
- Successful teaching approaches
- Areas where participants excel

#### Changes to make

Document necessary adjustments or improvements, such as:

- Areas needing additional support or explanation
- Modifications to teaching methods
- Resource or material adjustments

### Training Activity Timeline

The "My Training Activity" section displays your log entries in chronological order, organized by:

- Session number
- Assessment type
- Type of log (indicated by different icons)
- Description of the observation or change needed

### Best Practices for Logging

- Create logs immediately after reviewing monitoring results
- Be specific and concise in your descriptions
- Regular log entries help track the evolution of your training program
- Use the timeline to identify patterns and trends over time
- Balance observations with actionable changes

> 💡 **Reminder:** Maintaining a detailed logbook is crucial for continuous improvement. Regular entries help you track progress, identify patterns, and make informed decisions about your training program.

## The RESOURCES section

The RESOURCES section provides materials and guidance to help you make the most of the platform.

## The SETTINGS section

The SETTINGS section includes the subsection "My account" that allows you to manage your account information and platform settings.

### User Information

In this section, you can view your personal information:

- Full name
- Email address
- User status (Teacher-trainer or Teacher)
- User ID (for technical support)
- List of redeemed codes

### Platform Information

This section displays technical details about the platform:

- Platform name
- Current version number

### Account Management

You have the option to delete your account if needed. Please note:

- Account deletion is permanent
- All your data will be removed
- Shared monitorings and assessments will remain available to other users

> ⚠️ **Warning:** Deleting your account cannot be undone. Please make sure to export any important data before proceeding with account deletion.
