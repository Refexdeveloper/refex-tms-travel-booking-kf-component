import { FORM_FIELD_COMPONENTS, PLATFORMS } from '@kissflow/form-field-config'

const formFieldConfig = {
    [PLATFORMS.WEB]: {
        [FORM_FIELD_COMPONENTS.FORM_FIELD]: './src/web/FormField.jsx',
        [FORM_FIELD_COMPONENTS.SHEET]: './src/web/Sheet.jsx',
        [FORM_FIELD_COMPONENTS.DATA_TABLE]: './src/web/DataTable.jsx',
        [FORM_FIELD_COMPONENTS.CARD]: './src/web/Card.jsx',
    },
    [PLATFORMS.PWA]: {
        [FORM_FIELD_COMPONENTS.FORM_FIELD]: './src/pwa/FormField.jsx',
        [FORM_FIELD_COMPONENTS.DATA_TABLE]: './src/pwa/DataTable.jsx',
    },
}

export default formFieldConfig
