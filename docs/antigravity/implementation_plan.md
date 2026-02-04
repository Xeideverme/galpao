# Digital Contracts Module - Implementation Plan

## Overview
Implementing a complete Digital Contracts system for NextFit CRM+ERP that allows creating contract templates, generating personalized contracts, and collecting digital signatures.

## Proposed Changes

---

### Backend - Models & Endpoints

#### [MODIFY] [server.py](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/backend/server.py)

Add to the end of the file:

**New Models:**
- `ContratoTemplate` - Template with HTML content and placeholders
- `ContratoTemplateCreate` - Create template DTO
- `Contrato` - Full contract with signature data
- `ContratoCreate` - Create contract DTO
- `ContratoAssinar` - Signature submission DTO

**New Endpoints:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/contratos/templates` | Create template |
| GET | `/contratos/templates` | List templates |
| GET | `/contratos/templates/{id}` | Get template |
| PUT | `/contratos/templates/{id}` | Update template |
| DELETE | `/contratos/templates/{id}` | Deactivate template |
| POST | `/contratos` | Create contract |
| GET | `/contratos` | List contracts |
| GET | `/contratos/{id}` | Get contract |
| POST | `/contratos/{id}/assinar` | Sign contract |
| POST | `/contratos/{id}/enviar-email` | Send email |
| PUT | `/contratos/{id}/status` | Update status |
| DELETE | `/contratos/{id}` | Cancel contract |
| GET | `/contratos/vencendo-em/{dias}` | Expiring contracts |

---

### Frontend - New Pages

#### [NEW] [Contratos.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/pages/Contratos.js)
Main contracts list with filtering by status, cards showing contract info, and navigation to details/signing.

#### [NEW] [ContratoTemplates.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/pages/ContratoTemplates.js)
Template management page with create/edit/delete functionality and HTML editor.

#### [NEW] [NovoContrato.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/pages/NovoContrato.js)
Form to create new contract by selecting student, template, dates, and values.

#### [NEW] [DetalhesContrato.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/pages/DetalhesContrato.js)
Full contract view with rendered HTML, signature display, and action buttons.

#### [NEW] [AssinarContrato.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/pages/AssinarContrato.js)
Signature collection interface using signature canvas.

---

### Frontend - New Components

#### [NEW] [ContratoCard.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/components/ContratoCard.js)
Reusable card component for displaying contract summary.

#### [NEW] [AssinaturaCanvas.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/components/AssinaturaCanvas.js)
Wrapper component for react-signature-canvas with validation.

#### [NEW] [ContratoPreview.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/components/ContratoPreview.js)
Component to render contract HTML preview.

#### [NEW] [EditorTemplate.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/components/EditorTemplate.js)
HTML editor component for contract templates.

---

### Frontend - Integration

#### [MODIFY] [App.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/App.js)
Add imports and routes for all contract pages.

#### [MODIFY] [Layout.js](file:///c:/Users/Cliente/Documents/MeusProjetos/Aprendizado/galpaofc/galpao/frontend/src/components/Layout.js)
Add "Contratos" menu item with FileText icon.

---

## Verification Plan

### Automated Tests
- Test backend endpoints with curl/httpie commands
- Verify contract creation flow in browser

### Manual Verification
1. Create a contract template with placeholders
2. Generate a contract for an existing student
3. Sign the contract using the canvas
4. Verify the signature is saved
5. Verify status changes to "assinado"
6. Test PDF generation
7. Test filtering by status
