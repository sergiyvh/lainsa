// src/components/AuthLayout.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Paper, Typography, Link } from '@mui/material';
import { useI18n } from '../i18n/i18n';

// Використовуємо PUBLIC_URL для коректного шляху у фінальній збірці
const LainsaLogo = `${process.env.PUBLIC_URL}/logo512.png`;

const AuthLayout = ({ children, title }) => {
    const { t } = useI18n();

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f0f2f5',
                p: 2,
            }}
        >
            <Paper
                elevation={6}
                sx={{
                    padding: { xs: 2, sm: 4 },
                    borderRadius: '16px',
                    maxWidth: 400,
                    width: '100%',
                    textAlign: 'center'
                }}
            >
                <img src={LainsaLogo} alt="Lainsa Logo" style={{ height: '60px', marginBottom: '16px' }} />
                <Typography variant="h5" component="h1" gutterBottom>
                    {title}
                </Typography>
                {children}
            </Paper>
            <Typography variant="body2" sx={{ mt: 2 }}>
                <Link component={RouterLink} to="/license">
                    {t('auth_license_link')}
                </Link>
            </Typography>
        </Box>
    );
};

export default AuthLayout;