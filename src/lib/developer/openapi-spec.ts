export interface OpenApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  summary: string;
  description: string;
  tags: string[];
  parameters?: Array<{
    name: string;
    in: 'query' | 'header' | 'path';
    required?: boolean;
    schema: { type: string };
    description?: string;
  }>;
}

export function generateOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Knowledge Translation Network (KTN) Enterprise API',
      version: '1.0.0',
      description: 'Programmable Engineering Knowledge Platform REST v1 API Specification.',
      contact: {
        name: 'KTN Developer Relations',
        email: 'dev@ktn-network.org',
      },
    },
    servers: [
      {
        url: 'https://api.ktn-network.org/v1',
        description: 'Production Global Enterprise Gateway',
      },
    ],
    paths: {
      '/discovery/search': {
        get: {
          summary: 'Faceted Engineering Solution Search',
          description: 'Query verified engineering solutions using multi-dimensional filters & deterministic score ranking.',
          tags: ['Search & Discovery'],
          parameters: [
            { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search term' },
            { name: 'domain', in: 'query', schema: { type: 'string' }, description: 'Domain code' },
          ],
          responses: {
            '200': { description: 'Successful search results' },
          },
        },
      },
      '/knowledge': {
        get: {
          summary: 'List Peer-Reviewed Knowledge Entries',
          description: 'Retrieve peer-reviewed engineering knowledge entries with verification status.',
          tags: ['Knowledge Base'],
          responses: {
            '200': { description: 'List of knowledge records' },
          },
        },
      },
      '/standards': {
        get: {
          summary: 'List Standards Records',
          description: 'Query engineering standards (ISO, ASME, RTCA, IEEE, SAE, MIL-STD).',
          tags: ['Standards & Compliance'],
          responses: {
            '200': { description: 'List of standards' },
          },
        },
      },
      '/failures': {
        get: {
          summary: 'Query Failure Library & FMEA Data',
          description: 'Retrieve structured failure records and Risk Priority Number (RPN) scores.',
          tags: ['Failures & FMEA'],
          responses: {
            '200': { description: 'List of failure records' },
          },
        },
      },
    },
  };
}
