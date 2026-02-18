import { styled } from '@mui/material/styles';
import Switch from '@mui/material/Switch';

export const StyledSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase': {
        // Adjust the position of the switch base (knob) here if needed
    },
    '& .MuiSwitch-switchBase .MuiSwitch-thumb': {
        backgroundColor: 'white', // This can be any color that matches your design
        '&:before': {
            content: '"*"',
            position: 'absolute',
            top: '60%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '1.3rem',
            color: 'lightgrey', // Default (off) color
        },
    },
    '& .MuiSwitch-switchBase.Mui-checked .MuiSwitch-thumb': {
        '&:before': {
            color: 'red', // Checked (on) color
        },
    },
    '& .MuiSwitch-track': {
        // Adjust the track styling here if needed
    },
}));

export const questionContainerStyle = {
    border: '1px solid #ccc', // Change color as needed
    borderRadius: '8px',
    padding: '20px',
    margin: '10px 10px',
    backgroundColor: '#f9f9f9', // Light grey background
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Optional: adds shadow for depth
};

export const formControlStyle = {
    '.MuiOutlinedInput-root': {
        backgroundColor: 'white',
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.main',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'primary.light',
        },
    },
};

// Button Style
export const buttonStyle = {
    mr: 2, // margin right - to separate the buttons
    backgroundColor: '#F7941E',
    borderRadius: '50px',
    color: 'black',
    '&:hover': {
        backgroundColor: '#D17A1D',
    },
};

// Authentification form Style
export const authentificationFormStyle = {
    boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
    borderRadius: "15px",
    backgroundColor: "#fff",
    width: { xs: "90vw", md: "50vw" },
};

// Customize the toolbar configuration for rich text editor
export const toolbarConfig = {
    options: [
        'inline',
        'blockType',
        'fontSize',
        'fontFamily',
        'list',
        'textAlign',
        'colorPicker',
        'link',
        'embedded',
        'emoji',
        'image',
        'remove',
        'history'
    ],
    inline: {
        inDropdown: false,
        options: [
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'monospace',
            'superscript',
            'subscript'
        ],
    },
    blockType: {
        inDropdown: true,
        options: [
            'Normal',
            'H1',
            'H2',
            'H3',
            'H4',
            'H5',
            'H6',
            'Blockquote',
            'Code'
        ],
    },
    fontSize: {
        options: [
            8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96
        ],
    },
    fontFamily: {
        options: [
            'Arial',
            'Georgia',
            'Impact',
            'Tahoma',
            'Times New Roman',
            'Verdana'
        ],
    },
    list: {
        inDropdown: false,
        options: [
            'unordered',
            'ordered',
            'indent',
            'outdent'
        ],
    },
    textAlign: {
        inDropdown: false,
        options: [
            'left',
            'center',
            'right',
            'justify'
        ],
    },
    colorPicker: {
        colors: [
            'rgb(97,189,109)', 'rgb(26,188,156)', 'rgb(84,172,210)', 'rgb(44,130,201)',
            'rgb(147,101,184)', 'rgb(71,85,119)', 'rgb(204,204,204)', 'rgb(65,168,95)', 'rgb(0,168,133)',
            'rgb(61,142,185)', 'rgb(41,105,176)', 'rgb(85,57,130)', 'rgb(40,50,78)', 'rgb(0,0,0)',
            'rgb(247,218,100)', 'rgb(251,160,38)', 'rgb(235,107,86)', 'rgb(226,80,65)', 'rgb(163,143,132)',
            'rgb(239,239,239)', 'rgb(255,255,255)', 'rgb(250,197,28)', 'rgb(243,121,52)', 'rgb(209,72,65)',
            'rgb(184,49,47)', 'rgb(124,112,107)', 'rgb(209,213,216)'
        ],
    },
    link: {
        inDropdown: false,
        options: [
            'link',
            'unlink'
        ],
        showOpenOptionOnHover: true,
        defaultTargetOption: '_self',
    },
    emoji: {
        emojis: [
            '😀', '😁', '😂', '😃', '😉', '😋', '😎', '😍', '😗', '🤗', '🤔', '😣', '😫', '😴', '😌', '🤓',
            '😛', '😜', '😠', '😇', '😷', '😈', '👻', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '🙈',
            '🙉', '🙊', '👼', '👮', '🕵', '💂', '👳', '🎅', '👸', '👰', '👲', '🙍', '🙇', '🚶', '🏃', '💃',
            '⛷', '🏂', '🏌', '🏄', '🚣', '🏊', '⛹', '🏋', '🚴', '👫', '💪', '👈', '👉', '👉', '👆', '🖕',
            '👇', '🖖', '🤘', '🖐', '👌', '👍', '👎', '✊', '👊', '👏', '🙌', '🙏', '🐵', '🐶', '🐇', '🐥',
            '🐸', '🐌', '🐛', '🐜', '🐝', '🍉', '🍄', '🍔', '🍤', '🍨', '🍪', '🎂', '🍰', '🍾', '🍷', '🍸',
            '🍺', '🌍', '🚑', '⏰', '🌙', '🌝', '🌞', '⭐', '🌟', '🌠', '🌨', '🌩', '⛄', '🔥', '🎄', '🎈',
            '🎉', '🎊', '🎁', '🎗', '🏀', '🏈', '🎲', '🔇', '🔈', '📣', '🔔', '🎵', '🎷', '💰', '🖊', '📅',
            '✅', '❎', '💯'
        ],
    },
    embedded: {
        defaultSize: {
            height: 'auto',
            width: 'auto',
        },
    },
    image: {
        urlEnabled: true,
        uploadEnabled: false,
        alignmentEnabled: true,
        previewImage: false,
        inputAccept: 'image/gif,image/jpeg,image/jpg,image/png,image/svg',
        alt: { present: false, mandatory: false },
        defaultSize: {
            height: 'auto',
            width: 'auto',
            alignment: 'center'
        },
    },
    remove: {},
    history: {
        inDropdown: false,
        options: [
            'undo',
            'redo'
        ],
    },
};

// TODO define - main button style, secondary button style
export const mainButtonStyle = {
    // Define main button styles here
};

export const secondaryButtonStyle = {
    // Define secondary button styles here
};

export const redYellowGreenPalette = [
    'rgb(200, 50, 50)',
    'rgb(220, 70, 70)',
    'rgb(240, 120, 80)',
    'rgb(252, 180, 100)',
    'rgb(254, 224, 144)',
    'rgb(255, 255, 191)',
    'rgb(217, 239, 139)',
    'rgb(166, 217, 106)',
    'rgb(130, 190, 110)',
    'rgb(80, 170, 90)'
];

export const veryLightGray = 'rgb(237, 237, 237)';