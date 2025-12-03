import React from 'react';
import { Container, Typography, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const Documentation = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Documentation
      </Typography>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
        Complete guide to using the PLS-PM library
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Installation</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              Install PLS-PM using pip:
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {`pip install plspm`}
            </Box>
            <Typography variant="body1" paragraph>
              Or install from source:
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {`git clone https://github.com/your-repo/plspm.git
cd plspm
pip install -e .`}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Basic Usage</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              Here's a simple example of how to use PLS-PM:
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: 'grey.100',
                p: 2,
                borderRadius: 1,
                overflow: 'auto',
                fontFamily: 'monospace',
              }}
            >
              {`import plspm
import pandas as pd
import numpy as np

# Load your data
data = pd.read_csv('your_data.csv')

# Define the path matrix (relationships between constructs)
path_matrix = np.array([
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 0, 0],
    [1, 1, 1, 0]
])

# Define blocks (which variables belong to which construct)
blocks = {
    0: ['var1', 'var2', 'var3'],
    1: ['var4', 'var5'],
    2: ['var6', 'var7', 'var8'],
    3: ['var9', 'var10']
}

# Create and fit the model
model = plspm.Plspm(data, path_matrix, blocks)
results = model.fit()

# View results
print(results.summary())`}
            </Box>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">API Reference</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              <strong>Plspm(data, path_matrix, blocks, scheme='centroid', modes=None)</strong>
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Parameters:</strong>
            </Typography>
            <Typography variant="body2" component="div" sx={{ pl: 2 }}>
              • <strong>data:</strong> DataFrame containing the observed variables<br/>
              • <strong>path_matrix:</strong> Matrix defining the relationships between constructs<br/>
              • <strong>blocks:</strong> Dictionary mapping construct indices to variable names<br/>
              • <strong>scheme:</strong> Weighting scheme ('centroid', 'factor', 'path')<br/>
              • <strong>modes:</strong> List of modes for each block ('A' for reflective, 'B' for formative)
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Model Assessment</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              PLS-PM provides several measures to assess your model:
            </Typography>
            <Typography variant="body2" component="div" sx={{ pl: 2 }}>
              • <strong>R²:</strong> Coefficient of determination for endogenous constructs<br/>
              • <strong>Communality:</strong> Amount of variance explained by the construct<br/>
              • <strong>Redundancy:</strong> Amount of variance in endogenous constructs explained by their predictors<br/>
              • <strong>Cross-loadings:</strong> Correlation between indicators and constructs<br/>
              • <strong>Fornell-Larcker criterion:</strong> Discriminant validity assessment
            </Typography>
          </AccordionDetails>
        </Accordion>

        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="h6">Advanced Features</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body1" paragraph>
              Advanced features include:
            </Typography>
            <Typography variant="body2" component="div" sx={{ pl: 2 }}>
              • <strong>Bootstrap validation:</strong> Statistical significance testing<br/>
              • <strong>Multi-group analysis:</strong> Compare models across different groups<br/>
              • <strong>Moderating effects:</strong> Test interaction effects<br/>
              • <strong>Higher-order constructs:</strong> Model hierarchical relationships<br/>
              • <strong>Missing data handling:</strong> Various imputation methods
            </Typography>
          </AccordionDetails>
        </Accordion>
      </Box>
    </Container>
  );
};

export default Documentation;
