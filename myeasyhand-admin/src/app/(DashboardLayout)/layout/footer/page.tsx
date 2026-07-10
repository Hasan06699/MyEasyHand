'use client';
import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box sx={{ pt: 6, textAlign: "center" }}>
      <Typography color="text.secondary">
        © {new Date().getFullYear()} MyEasyHand. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
