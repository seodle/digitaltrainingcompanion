import React from 'react';
import IconButton from '@mui/material/IconButton';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Tooltip } from '@mui/material';

// for i18n
import { useMessageService } from '../services/MessageService';

const MandatoryToggle = ({ isMandatory, toggleMandatory }) => {
  // for the translations
  const { getMessage } = useMessageService();

  return (
    <Tooltip title={isMandatory ? getMessage("label_tooltip_make_question_optional") : getMessage("label_tooltip_make_question_mandatory")}>
      <IconButton onClick={toggleMandatory} color={isMandatory ? "error" : "success"}>
        {isMandatory ? <LockIcon /> : <LockOpenIcon />}
      </IconButton>
    </Tooltip>
  );
};

export default MandatoryToggle;