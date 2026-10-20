import React from 'react';
import { Box } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

// Responsive YouTube player whose captions and UI follow the app language.
// Captions must exist for that language on the video (YouTube Studio).
const YouTubeEmbed = ({ videoId, title }) => {
    const { languageCode } = useLanguage();

    const params = new URLSearchParams({
        cc_load_policy: '1',      // show captions by default
        cc_lang_pref: languageCode, // preferred caption language
        hl: languageCode,         // player UI language
        rel: '0',
        modestbranding: '1',
    });

    return (
        <Box
            sx={{
                width: '100%',
                maxWidth: '900px',
                mx: 'auto',
                mb: '20px',
                aspectRatio: '16 / 9',
                borderRadius: '10px',
                overflow: 'hidden',
                boxShadow: 2,
                bgcolor: '#000',
            }}
        >
            <iframe
                key={languageCode}
                src={`https://www.youtube-nocookie.com/embed/${videoId}?${params}`}
                title={title}
                loading="lazy"
                allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 0 }}
            />
        </Box>
    );
};

export default YouTubeEmbed;
