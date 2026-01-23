import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Edit, Eye, Copy, Slash } from 'lucide-react';

import { useMessageService } from '../services/MessageService';
import { OptionTypes } from '../utils/enums';


const ThreeDotsMenu = ({ options, onDelete, onEdit, onPreview, onOpen, onCopy, onTerminate, onDeleteAllAnswers, onUnshare  }) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [openConfirm, setOpenConfirm] = useState(false);  // new state for the confirmation dialog
    const [openConfirmDeleteAll, setOpenConfirmDeleteAll] = useState(false);

    const { getMessage } = useMessageService();

    const open = Boolean(anchorEl);
    const ITEM_HEIGHT = 48;

    
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleClose = () => {
      setAnchorEl(null);
    };
  
    const handleOptionClick = (option) => {
      switch (option) {
        case OptionTypes.DELETE:
          setOpenConfirm(true);
          break;
        case OptionTypes.EDIT:
          onEdit();
          break;
        case OptionTypes.PREVIEW:
          onPreview();
          break;
        case OptionTypes.OPEN:
          onOpen();
          handleClose();
          break;
        case OptionTypes.COPY:
          onCopy();
          handleClose();
          break;
        case OptionTypes.CLOSE:
          onTerminate();
          handleClose();
          break;
        case OptionTypes.DELETE_ALL_ANSWERS:
          setOpenConfirmDeleteAll(true);
          break;
        case OptionTypes.UNSHARE:
          onUnshare();
          break;
        default:
          handleClose();
      }
    };

    const getOptionIcon = (option) => {
      switch (option) {
        case OptionTypes.DELETE:
          return <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />;
        case OptionTypes.EDIT:
          return <Edit size={16} style={{ marginRight: 8 }} />;
        case OptionTypes.PREVIEW:
          return <Eye size={16} style={{ marginRight: 8 }} />;
        case OptionTypes.COPY:
          return <Copy size={16} style={{ marginRight: 8 }} />;
        case OptionTypes.DELETE_ALL_ANSWERS:
          return <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />;
        case OptionTypes.UNSHARE:
          return <Slash size={16} style={{ marginRight: 8 }} />;
        default:
          return null;
      }
    };

    const handleOptionLocalization = (option) => {
      switch (option) {
        case OptionTypes.DELETE:
          return getMessage('label_delete');
        case OptionTypes.EDIT:
          return getMessage('label_edit');
        case OptionTypes.PREVIEW:
          return getMessage('label_preview');
        case OptionTypes.OPEN:
          return getMessage('label_open');
        case OptionTypes.COPY:
          return getMessage('label_copy');
        case OptionTypes.CLOSE:
          return getMessage('label_close');
        case OptionTypes.DELETE_ALL_ANSWERS:
          return getMessage('label_delete_all_answers');
        case OptionTypes.UNSHARE:
          return getMessage('label_unshare_monitoring');
        default:
          break;
      }
    }
  
    const handleConfirmDelete = () => {
      onDelete();  // call the onDelete function passed from the parent component
      setOpenConfirm(false);  // close the confirmation dialog
      handleClose();  // close the menu
    }

    const handleConfirmDeleteAll = () => {
      onDeleteAllAnswers();  // call the onDeleteAllAnswers function passed from the parent component
      setOpenConfirmDeleteAll(false);  // close the confirmation dialog
      handleClose();  // close the menu
  };
  
    return (
      <div>
        <IconButton
          aria-label="more"
          aria-controls="long-menu"
          aria-haspopup="true"
          onClick={handleClick}
        >
          <MoreVertIcon />
        </IconButton>
        <Menu
          id="long-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          MenuListProps={{
            style: {
              maxHeight: ITEM_HEIGHT * 4.5,
              width: '30ch',
            },
          }}
  
        >
          {options.map((option) => (
            <MenuItem
              key={option}
              onClick={() => handleOptionClick(option, onDelete)}
              sx={{
                color: (option === OptionTypes.DELETE || option === OptionTypes.DELETE_ALL_ANSWERS) ? 'error.main' : 'inherit',
              }}
            >
              {getOptionIcon(option)}
              {handleOptionLocalization(option)}
            </MenuItem>
          ))}
        </Menu>

        {/* confirmation dialog */}
        <Dialog
          open={openConfirm}
          onClose={() => setOpenConfirm(false)}
        >
          <DialogTitle variant="h3">{getMessage("label_confirmation")}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              {getMessage("label_ask_confirmation")}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenConfirm(false)} color="primary">
              {getMessage("label_cancel")}
            </Button>
            <Button onClick={handleConfirmDelete} color="primary">
              {getMessage("label_continue")}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation dialog for delete all answers */}
        <Dialog
          open={openConfirmDeleteAll}
          onClose={() => setOpenConfirmDeleteAll(false)}
        >
          <DialogTitle variant="h3">{getMessage("label_confirmation")}</DialogTitle>
            <DialogContent>
              <DialogContentText>
                {getMessage("label_ask_confirmation")}
              </DialogContentText>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setOpenConfirmDeleteAll(false)} color="primary">
                {getMessage("label_cancel")}
              </Button>
              <Button onClick={handleConfirmDeleteAll} color="primary">
                {getMessage("label_continue")}
              </Button>
            </DialogActions>
        </Dialog>
      </div>
    );
  };

export default ThreeDotsMenu;