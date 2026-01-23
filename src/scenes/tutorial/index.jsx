import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stepper, Step, StepLabel, Typography, Box, Button, Paper, useTheme, useMediaQuery } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";

const Tutorial = () => {
    const [activeStep, setActiveStep] = useState(0);
    const [tutorialContent, setTutorialContent] = useState({});
    const [tutorialConfig, setTutorialConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();
    const contentRef = useRef(null);

    // Load tutorial configuration and content
    useEffect(() => {
        const loadTutorialContent = async () => {
            try {
                // Load config first
                const configResponse = await fetch('/tutorials/config.json');
                if (!configResponse.ok) {
                    throw new Error('Failed to load tutorial config');
                }
                const config = await configResponse.json();
                setTutorialConfig(config);

                // Load tutorial content
                const content = {};
                
                for (const step of config.steps) {
                    try {
                        const response = await fetch(`/tutorials/${step.file}`);
                        if (response.ok) {
                            const text = await response.text();
                            content[step.file] = text;
                        } else {
                            throw new Error(`Failed to load ${step.file}`);
                        }
                    } catch (error) {
                        console.error(`Failed to load tutorial content for ${step.file}:`, error);
                        content[step.file] = `# ${step.title}\n\nContent not available.`;
                    }
                }
                
                setTutorialContent(content);
                setLoading(false);
            } catch (error) {
                console.error('Failed to load tutorial configuration:', error);
                setLoading(false);
            }
        };

        loadTutorialContent();
    }, []);

    const handleNext = () => {
        setActiveStep((prevStep) => {
            const nextStep = prevStep + 1;
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
            return nextStep;
        });
    };

    const handleBack = () => {
        setActiveStep((prevStep) => {
            const nextStep = Math.max(prevStep - 1, 0);
            if (contentRef.current) {
                contentRef.current.scrollTop = 0;
            }
            return nextStep;
        });
    };

    const handleStepClick = (stepIndex) => {
        setActiveStep(stepIndex);
        if (contentRef.current) {
            contentRef.current.scrollTop = 0;
        }
    };

    const renderStepContent = (step) => {
        if (loading || !tutorialConfig) {
                return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography>Loading tutorial content...</Typography>
                    </Box>
                );
        }

        const currentStep = tutorialConfig.steps[step];
        const content = tutorialContent[currentStep.file];

        if (!content) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <Typography>Content not available</Typography>
                </Box>
            );
        }

    return (
            <Box sx={{ 
                fontFamily: '"Source Sans Pro", "sans-serif"',
                '& h1': { 
                    fontSize: isMobile ? '1.8rem' : '2.4rem',
                    fontWeight: '700',
                    mb: 2,
                    color: '#333',
                    lineHeight: 1.3
                },
                '& h2': { 
                    fontSize: isMobile ? '1.5rem' : '2rem',
                    fontWeight: '600',
                    mb: 1.5,
                    mt: 3,
                    color: '#444',
                    lineHeight: 1.4
                },
                '& h3': { 
                    fontSize: isMobile ? '1.3rem' : '1.6rem',
                    fontWeight: '600',
                    mb: 1,
                    mt: 2,
                    color: '#555',
                    lineHeight: 1.4
                },
                '& p': { 
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    lineHeight: 1.7,
                    mb: 1.5,
                    textAlign: 'justify',
                    fontWeight: '400'
                },
                '& ul, & ol': { 
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    lineHeight: 1.7,
                    mb: 1.5,
                    pl: 2.5
                },
                '& li': { 
                    mb: 0.8,
                    fontWeight: '400'
                },
                '& blockquote': {
                    borderLeft: '4px solid #F7941E',
                    pl: 2.5,
                    ml: 0,
                    backgroundColor: '#FFF3E0',
                    py: 1.5,
                    borderRadius: '4px',
                    mb: 2,
                    fontSize: isMobile ? '1rem' : '1.1rem',
                    fontStyle: 'italic'
                },
                '& strong': {
                    fontWeight: '600',
                    color: '#F7941E'
                },
                '& a': {
                    color: '#1976D2',
                    textDecoration: 'none',
                    fontWeight: '500',
                    '&:hover': {
                        textDecoration: 'underline'
                    }
                },
                '& code': {
                    backgroundColor: '#f5f5f5',
                    padding: '3px 6px',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '0.9rem'
                },
                '& pre': {
                    backgroundColor: '#f5f5f5',
                    padding: '1.5rem',
                    borderRadius: '6px',
                    overflow: 'auto',
                    mb: 2,
                    fontSize: '0.9rem'
                },
                '& img': {
                    maxWidth: '50%',
                    height: 'auto',
                    borderRadius: '8px',
                    margin: '16px 0',
                    display: 'block',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                },
                '& div': {
                    '&[style*="background"]': {
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(247, 148, 30, 0.15)',
                        margin: '24px 0',
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        lineHeight: 1.7
                    }
                }
            }}>
                <ReactMarkdown 
                    rehypePlugins={[rehypeRaw]}
                    components={{
                        img: ({src, alt, ...props}) => {
                            const isMainFunctionalities = activeStep === 2; // Main functionalities is step 3 (index 2)
                            const isQrCodeImage = src && src.includes('qr_code_section_en.png');
                            
                            let maxWidth = '50%';
                            if (isMainFunctionalities && !isQrCodeImage) {
                                maxWidth = '75%';
                            } else if (isQrCodeImage) {
                                maxWidth = '35%';
                            }
                            
                            return (
                                <img 
                                    src={src} 
                                    alt={alt} 
                                    {...props}
                        style={{
                                        maxWidth: maxWidth,
                                        height: 'auto',
                                        borderRadius: '8px',
                                        margin: '16px 0',
                                        display: 'block',
                                        marginLeft: 'auto',
                                        marginRight: 'auto'
                                    }}
                                />
                            );
                        }
                    }}
                >
                    {content}
                </ReactMarkdown>
            </Box>
        );
    };

    if (!tutorialConfig) {
        return (
            <Box display="flex" height="100vh">
                {!isMobile && <Sidebar />}
                <Box display="flex" flexDirection="column" flexGrow={1} overflow="hidden">
                    <Box mt="10px" ml="10px">
                        <Topbar title="Tutorial" />
                    </Box>
                    <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1}>
                        <Typography>Failed to load tutorial configuration</Typography>
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box display="flex" height="100vh">
            {!isMobile && <Sidebar />}
            <Box display="flex" flexDirection="column" flexGrow={1} overflow="hidden">
                <Box mt="10px" ml="10px">
                    <Topbar title="Tutorial" />
                </Box>

                <Box 
                    ref={contentRef}
                    flexGrow={1} 
                    overflow="auto" 
                    m={isMobile ? "10px" : "20px"}
                    sx={{
                        paddingRight: '15px',
                        '&::-webkit-scrollbar': {
                            width: '0.4em'
                        },
                        '&::-webkit-scrollbar-track': {
                            boxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)',
                            webkitBoxShadow: 'inset 0 0 6px rgba(0,0,0,0.00)'
                        },
                        '&::-webkit-scrollbar-thumb': {
                            backgroundColor: 'rgba(0,0,0,.1)',
                            outline: '1px solid slategrey'
                        }
                    }}
                >
                    <Paper 
                        elevation={2} 
                        sx={{ 
                            padding: isMobile ? '10px' : '20px', 
                            paddingBottom: isMobile ? '30px' : '40px',  
                            borderRadius: '10px',
                            marginBottom: '20px' 
                        }}
                    >
                        <Stepper activeStep={activeStep} alternativeLabel orientation={isMobile ? 'vertical' : 'horizontal'}>
                            {tutorialConfig.steps.map((step, index) => (
                                <Step key={index} active={activeStep === index} onClick={() => handleStepClick(index)}>
                                    <StepLabel
                                        sx={{
                                            cursor: 'pointer',
                                            '& .MuiStepIcon-root': {
                                                color: activeStep === index ? '#F7941D' : '#D3D3D3',
                                            }
                                        }}
                                    >
                                        {isMobile ? <Typography variant="caption">{step.title}</Typography> : step.title}
                                    </StepLabel>
                                </Step>
                            ))}
                        </Stepper>

                        <Box mt="20px">
                            {renderStepContent(activeStep)}
                        </Box>

                        <Box mt="20px" display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between">
                            <Button
                                disabled={activeStep === 0}
                                onClick={handleBack}
                                variant="contained"
                                fullWidth={isMobile}
                                sx={{ 
                                    backgroundColor: '#F7941E',
                                    borderRadius: '50px',
                                    color: 'black',
                                    '&:hover': { backgroundColor: '#D17A1D' },
                                    mb: isMobile ? 2 : 0
                                }}
                            >
                                {tutorialConfig.buttons.back}
                            </Button>

                            <Button
                                onClick={activeStep === tutorialConfig.steps.length - 1 ? handleBack : handleNext}
                                variant="contained"
                                fullWidth={isMobile}
                                sx={{ 
                                    backgroundColor: '#F7941E',
                                    borderRadius: '50px',
                                    color: 'black',
                                    '&:hover': { backgroundColor: '#D17A1D' }
                                }}
                            >
                                {activeStep === tutorialConfig.steps.length - 1 ? tutorialConfig.buttons.startAgain : tutorialConfig.buttons.next}
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
};

export default Tutorial;